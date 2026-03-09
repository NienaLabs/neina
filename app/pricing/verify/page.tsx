"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Inner component that reads URL params and triggers the appropriate
 * verification flow — Paystack (reference) or Polar (checkout_id).
 * Must be wrapped in a Suspense boundary because it uses useSearchParams.
 */
function PaymentVerifier() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reference = searchParams.get("reference");     // Paystack flow
  const checkoutId = searchParams.get("checkout_id"); // Polar flow

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Paystack verification
  const verifyPaystack = trpc.payment.verifyTransaction.useMutation({
    onSuccess: () => setStatus("success"),
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Failed to verify transaction");
    },
  });

  // Polar checkout verification
  const verifyPolar = trpc.payment.verifyPolarCheckout.useMutation({
    onSuccess: () => setStatus("success"),
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Failed to verify checkout");
    },
  });

  useEffect(() => {
    if (reference) {
      // Paystack flow: verify by transaction reference
      verifyPaystack.mutate({ reference });
    } else if (checkoutId) {
      // Polar flow: verify by checkout ID
      verifyPolar.mutate({ checkoutId });
    } else {
      setStatus("error");
      setMessage("No transaction reference or checkout ID found in the URL.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, checkoutId]);

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
              Please wait while we confirm your transaction.
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
 * Handles both Paystack (?reference=xxx) and Polar (?checkout_id=xxx) redirects.
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
