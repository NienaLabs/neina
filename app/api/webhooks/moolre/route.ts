import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/moolre";
import { fulfillTransaction, failTransaction } from "@/lib/fulfillment";

/**
 * POST /api/webhooks/moolre
 *
 * Moolre payment callback. Register this URL as the `callback` on your Moolre
 * account (app.moolre.com → wallet settings) — it also gets attached per-link
 * when we generate hosted checkouts.
 *
 * Payload shape (see docs.moolre.com → Payment Webhook):
 *   { status: 1, code: "P01", message: "Transaction Successful", data: { ...tx } }
 * where data contains our `externalref` (the transaction reference we created).
 *
 * SECURITY: Moolre callbacks are not signed, so we never trust the payload.
 * The externalref is extracted and the authoritative status is re-fetched
 * from Moolre's status API before any fulfillment happens. Fulfillment itself
 * is idempotent (PENDING → SUCCESS flip), so webhook retries and races with
 * the client-side poller are safe.
 */
export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const externalref: string | undefined =
    payload?.data?.externalref ?? payload?.externalref;

  if (!externalref || typeof externalref !== "string") {
    console.warn("[Moolre Webhook] No externalref in payload — ignoring");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log(`[Moolre Webhook] Callback for reference ${externalref}`);

  try {
    // Re-verify with Moolre — the webhook body is only treated as a hint
    const statusRes = await getPaymentStatus(externalref);

    if (statusRes.kind === "success") {
      await fulfillTransaction(externalref);
    } else if (statusRes.kind === "failed") {
      await failTransaction(externalref);
    }
    // pending → do nothing; the poller or a later callback will settle it
  } catch (err: any) {
    // Log but still return 200 — retries could double-process a transient error,
    // and fulfillment is idempotent anyway
    console.error(`[Moolre Webhook] Error processing ${externalref}:`, err.message);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
