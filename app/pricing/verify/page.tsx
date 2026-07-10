"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** How long we poll Moolre for confirmation before giving up (ms). */
const POLL_TIMEOUT_MS = 2 * 60 * 1000;
const POLL_INTERVAL_MS = 4000;

/**
 * Inner component that reads the ?reference= param (set when we generated the
 * Moolre checkout/redirect URL) and polls the server, which verifies against
 * Moolre's status API and fulfills the purchase.
 * Must be wrapped in a Suspense boundary because it uses useSearchParams.
 */
function PaymentVerifier() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference = searchParams.get("reference");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const checkTransaction = trpc.payment.checkTransaction.useMutation();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!reference) {
      setStatus("error");
      setMessage("No transaction reference found in the URL.");
      return;
    }

    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await checkTransaction.mutateAsync({ reference });
        if (cancelled) return;
        if (res.status === "SUCCESS") {
          setStatus("success");
          return;
        }
        if (res.status === "FAILED") {
          setStatus("error");
          setMessage(res.message || "Payment failed verification");
          return;
        }
      } catch (err: any) {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message || "Failed to verify transaction");
        return;
      }
      // Still pending — Moolre may take a moment to settle the charge
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setStatus("error");
        setMessage(
          "We couldn't confirm your payment yet. If you completed it, your account will be updated automatically in a few minutes."
        );
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  // Validate returnUrl to prevent open redirect attacks
  const from = searchParams.get("from");
  const allowedPaths = ["/dashboard", "/pricing"];
  const returnUrl = from && allowedPaths.includes(from) ? from : "/pricing";
  const returnLabel = from === "/dashboard" ? "Dashboard" : "Pricing";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full p-8 bg-card border rounded-2xl shadow-lg text-center space-y-6">

        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
            <h2 className="text-2xl font-bold">Verifying Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your transaction with Moolre.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
            <p className="text-muted-foreground">
              Your account has been updated. It may take a few seconds for your new plan to reflect.
            </p>
            <Button className="w-full" onClick={() => router.push(returnUrl)}>
              Return to {returnLabel}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => router.push("/pricing")}>
                Back to Pricing
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(returnUrl)}
              >
                Return to {returnLabel}
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

/**
 * Payment verification page.
 * Handles the redirect back from Moolre hosted checkout (?reference=xxx).
 */
export default function VerifyPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <PaymentVerifier />
    </Suspense>
  );
}
