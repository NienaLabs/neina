"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  Smartphone,
  CreditCard,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** What the user is buying — mirrors the server's purchase schema. */
export type Purchase =
  | { type: "SUBSCRIPTION"; plan: "SILVER" | "GOLD" | "DIAMOND" }
  | { type: "CREDIT_PURCHASE"; packKey: "CREDITS_10" | "CREDITS_20" | "CREDITS_30" | "CREDITS_50" }
  | { type: "MINUTE_PURCHASE"; packKey: "MINUTES_15" };

export interface PaymentItem {
  purchase: Purchase;
  /** e.g. "Gold Plan (30 days)" */
  label: string;
  /** e.g. "₵750" */
  amountLabel: string;
}

interface MoolrePaymentDialogProps {
  item: PaymentItem | null;
  onClose: () => void;
  /** Called after a confirmed successful payment */
  onSuccess: () => void;
}

const NETWORKS = [
  { key: "MTN", label: "MTN MoMo", color: "bg-yellow-400" },
  { key: "TELECEL", label: "Telecel Cash", color: "bg-red-500" },
  { key: "AT", label: "AT Money", color: "bg-blue-500" },
] as const;

type NetworkKey = (typeof NETWORKS)[number]["key"];

/** Guesses the momo network from a Ghanaian phone number prefix. */
function detectNetwork(phone: string): NetworkKey | null {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("233") ? `0${digits.slice(3)}` : digits;
  const prefix = local.slice(0, 3);
  if (["024", "025", "053", "054", "055", "059"].includes(prefix)) return "MTN";
  if (["020", "050"].includes(prefix)) return "TELECEL";
  if (["026", "027", "056", "057"].includes(prefix)) return "AT";
  return null;
}

type Step = "details" | "otp" | "waiting" | "success" | "failed";

/** How long we poll for payer approval before giving up (ms). */
const POLL_TIMEOUT_MS = 3 * 60 * 1000;
const POLL_INTERVAL_MS = 4000;

/**
 * In-app Moolre mobile money checkout.
 *
 * details → (optional otp) → waiting (USSD prompt on payer's phone, we poll
 * the server which verifies against Moolre) → success / failed.
 * A hosted checkout ("Pay with card") is offered as an alternative.
 */
export default function MoolrePaymentDialog({
  item,
  onClose,
  onSuccess,
}: MoolrePaymentDialogProps) {
  const [step, setStep] = useState<Step>("details");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<NetworkKey>("MTN");
  const [networkTouched, setNetworkTouched] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const pollStartRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // Reset state whenever a new purchase opens the dialog
  useEffect(() => {
    if (item) {
      setStep("details");
      setOtpCode("");
      setOtpMessage("");
      setReference(null);
      setErrorMessage("");
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const checkTransaction = trpc.payment.checkTransaction.useMutation();

  const pollStatus = (ref: string) => {
    pollTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkTransaction.mutateAsync({ reference: ref });
        if (res.status === "SUCCESS") {
          setStep("success");
          onSuccess();
          return;
        }
        if (res.status === "FAILED") {
          setErrorMessage(res.message || "The payment was declined or cancelled.");
          setStep("failed");
          return;
        }
      } catch {
        // transient error — keep polling until timeout
      }
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        setErrorMessage(
          "We didn't receive approval in time. If you approved the prompt, your account will still be updated automatically."
        );
        setStep("failed");
        return;
      }
      pollStatus(ref);
    }, POLL_INTERVAL_MS);
  };

  const initiateMomo = trpc.payment.initiateMomoPayment.useMutation({
    onSuccess: (data) => {
      setReference(data.reference);
      if (data.status === "otp_required") {
        setOtpMessage(data.message);
        setStep("otp");
        return;
      }
      // Prompt dispatched to the payer's phone — start polling
      setStep("waiting");
      pollStartRef.current = Date.now();
      pollStatus(data.reference);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate payment");
    },
  });

  const initiateHosted = trpc.payment.initiateHostedCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to secure Moolre checkout...");
      window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout");
    },
  });

  if (!item) return null;

  const isBusy = initiateMomo.isPending || initiateHosted.isPending;

  const onPhoneChange = (value: string) => {
    setPhone(value);
    if (!networkTouched) {
      const detected = detectNetwork(value);
      if (detected) setNetwork(detected);
    }
  };

  const submitMomo = (otp?: string) => {
    initiateMomo.mutate({
      purchase: item.purchase,
      phone,
      network,
      // The pending reference is only reused for the OTP retry — a fresh
      // attempt must create a fresh transaction (old ones may be FAILED)
      ...(otp ? { otpcode: otp, ...(reference ? { reference } : {}) } : {}),
    });
  };

  const phoneValid = phone.replace(/\D/g, "").length >= 9;

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) { stopPolling(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-indigo-600" />
            Pay with Mobile Money
          </DialogTitle>
          <DialogDescription>
            {item.label} · <span className="font-semibold text-foreground">{item.amountLabel}</span>
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="momo-phone">Mobile Money number</Label>
              <Input
                id="momo-phone"
                type="tel"
                inputMode="tel"
                placeholder="e.g. 024 412 3456"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Network</Label>
              <RadioGroup
                value={network}
                onValueChange={(v) => { setNetwork(v as NetworkKey); setNetworkTouched(true); }}
                className="grid grid-cols-3 gap-2"
              >
                {NETWORKS.map((n) => (
                  <Label
                    key={n.key}
                    htmlFor={`network-${n.key}`}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer text-xs font-medium transition-colors",
                      network === n.key
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                        : "border-border hover:border-indigo-300"
                    )}
                  >
                    <RadioGroupItem id={`network-${n.key}`} value={n.key} className="sr-only" />
                    <span className={cn("h-2.5 w-2.5 rounded-full", n.color)} />
                    {n.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                disabled={!phoneValid || isBusy}
                onClick={() => submitMomo()}
              >
                {initiateMomo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Pay {item.amountLabel}</>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={isBusy}
                onClick={() => initiateHosted.mutate({ purchase: item.purchase })}
              >
                {initiateHosted.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with card / other methods
                  </>
                )}
              </Button>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Payments secured by Moolre · GHS
            </p>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {otpMessage || "Enter the verification code Moolre sent to your phone via SMS."}
            </p>
            <div className="space-y-2">
              <Label htmlFor="momo-otp">Verification code</Label>
              <Input
                id="momo-otp"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                autoFocus
              />
            </div>
            <Button
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              disabled={otpCode.trim().length < 4 || isBusy}
              onClick={() => submitMomo(otpCode.trim())}
            >
              {initiateMomo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify & Continue"
              )}
            </Button>
          </div>
        )}

        {step === "waiting" && (
          <div className="space-y-4 text-center py-4">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/40">
                <Smartphone className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold">Approve on your phone</h3>
            <p className="text-sm text-muted-foreground">
              We sent a payment prompt to <span className="font-medium text-foreground">{phone}</span>.
              Enter your {NETWORKS.find((n) => n.key === network)?.label} PIN to approve{" "}
              <span className="font-medium text-foreground">{item.amountLabel}</span>.
            </p>
            <p className="text-xs text-muted-foreground">
              No prompt? Dial <span className="font-mono font-semibold">*203#</span> to approve
              pending payments. This screen updates automatically.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Waiting for approval...
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-600">Payment successful!</h3>
            <p className="text-sm text-muted-foreground">
              {item.label} has been added to your account.
            </p>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {step === "failed" && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <XCircle className="h-9 w-9 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-600">Payment not completed</h3>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button
              className="w-full"
              onClick={() => {
                setReference(null);
                setOtpCode("");
                setStep("details");
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
