import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PLANS, PlanKey, PAYSTACK_PLAN_CODES } from "@/lib/plans";

/**
 * Verifies the Paystack webhook signature.
 *
 * Paystack signs all webhook payloads by computing an HMAC-SHA512 hash
 * of the raw request body using your secret key, then sends the hash
 * in the `x-paystack-signature` header. We recompute it and compare.
 *
 * @param rawBody - The raw request body as a UTF-8 string
 * @param signature - The value of the x-paystack-signature header
 * @returns true if the signature is valid
 */
function verifyPaystackWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

/**
 * Maps a Paystack plan code to our internal PlanKey.
 * Returns null if the plan code doesn't match any known plan.
 */
function resolvePlanFromPaystackCode(planCode: string): PlanKey | null {
  if (planCode === PAYSTACK_PLAN_CODES.SILVER) return "SILVER";
  if (planCode === PAYSTACK_PLAN_CODES.GOLD) return "GOLD";
  if (planCode === PAYSTACK_PLAN_CODES.DIAMOND) return "DIAMOND";
  return null;
}

/**
 * POST /api/webhooks/paystack
 *
 * Paystack webhook handler for recurring subscription events.
 * Must be registered in the Paystack dashboard under Settings → Webhooks.
 * Set the webhook URL to: https://your-app.com/api/webhooks/paystack
 *
 * Events handled:
 *   - charge.success: Fires on every successful charge (initial + renewals).
 *     Updates plan, credits, interview minutes, and stores the subscription code.
 *   - subscription.disable: Fires when a subscription is disabled/cancelled.
 *     Downgrades the user to FREE plan.
 *
 * IMPORTANT: Paystack requires a 200 response within 10s. All DB ops must be fast.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    console.warn("[Paystack Webhook] Invalid signature — rejecting request");
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: any };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { event: eventType, data } = event;
  console.log(`[Paystack Webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case "charge.success": {
        await handleChargeSuccess(data);
        break;
      }
      case "subscription.disable": {
        await handleSubscriptionDisable(data);
        break;
      }
      default:
        // Unhandled event — acknowledged but not processed
        console.log(`[Paystack Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err: any) {
    // Log but still return 200 — Paystack retries on non-200 responses,
    // which could cause duplicate processing if the error was non-transient
    console.error(`[Paystack Webhook] Error handling ${eventType}:`, err.message);
  }

  // Always respond 200 to acknowledge receipt
  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Handles the charge.success event.
 *
 * Fires on:
 *   - First payment when a user subscribes to a plan
 *   - Every monthly renewal charge
 *
 * Looks up the transaction by reference, then upgrades/renews the user's plan.
 * Also stores the subscription code for future cancellation.
 */
async function handleChargeSuccess(data: any) {
  const reference = data.reference as string;
  const metadata = data.metadata as any;
  const subscriptionCode = data.subscription_code as string | undefined;
  const customerCode = data.customer?.customer_code as string | undefined;

  // Determine userId: prefer metadata (set during initializeTransaction),
  // fall back to finding user by email for subscription renewals
  let userId: string | null = metadata?.userId ?? null;

  if (!userId) {
    const email = data.customer?.email as string | undefined;
    if (email) {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      userId = user?.id ?? null;
    }
  }

  if (!userId) {
    console.error(`[Paystack Webhook] charge.success: cannot resolve userId for reference ${reference}`);
    return;
  }

  // Find plan from the transaction record or from metadata
  let planKey: PlanKey | null = null;

  const txRecord = await prisma.transaction.findUnique({
    where: { reference },
    select: { plan: true, type: true, credits: true, minutes: true },
  });

  if (txRecord?.plan) {
    planKey = txRecord.plan as PlanKey;
  } else if (metadata?.plan) {
    planKey = metadata.plan as PlanKey;
  } else if (data.plan?.plan_code) {
    // Renewal: Paystack sends the plan object on recurring charges
    planKey = resolvePlanFromPaystackCode(data.plan.plan_code);
  }

  if (!planKey || planKey === "FREE") {
    // Handle credit/minute purchases if applicable
    if (txRecord?.type === "CREDIT_PURCHASE" && txRecord.credits) {
      await prisma.user.update({
        where: { id: userId },
        data: { resume_credits: { increment: txRecord.credits } },
      });
      await prisma.transaction.update({ where: { reference }, data: { status: "SUCCESS" } });
    } else if (txRecord?.type === "MINUTE_PURCHASE" && txRecord.minutes) {
      await prisma.user.update({
        where: { id: userId },
        data: { interview_minutes: { increment: txRecord.minutes } },
      });
      await prisma.transaction.update({ where: { reference }, data: { status: "SUCCESS" } });
    }
    return;
  }

  const planData = PLANS[planKey];

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planKey,
      resume_credits: { increment: planData.credits },
      interview_minutes: { increment: planData.minutes },
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ...(subscriptionCode ? { paystackSubscriptionCode: subscriptionCode } : {}),
      ...(customerCode ? { paystackCustomerCode: customerCode } : {}),
    },
  });

  // Mark transaction as SUCCESS if it exists in our DB
  if (txRecord) {
    await prisma.transaction.update({ where: { reference }, data: { status: "SUCCESS" } });
  }

  console.log(`[Paystack Webhook] charge.success: upgraded user ${userId} to ${planKey}`);
}

/**
 * Handles the subscription.disable event.
 *
 * Fires when:
 *   - User cancels via Paystack customer portal
 *   - Subscription is disabled via API (our cancelSubscription procedure)
 *   - Repeated payment failures cause auto-disable
 *
 * Downgrades the user to FREE immediately.
 */
async function handleSubscriptionDisable(data: any) {
  const subscriptionCode = data.subscription_code as string | undefined;
  const customerCode = data.customer?.customer_code as string | undefined;
  const customerEmail = data.customer?.email as string | undefined;

  let user = null;

  if (subscriptionCode) {
    user = await prisma.user.findFirst({
      where: { paystackSubscriptionCode: subscriptionCode },
      select: { id: true },
    });
  }

  if (!user && customerCode) {
    user = await prisma.user.findFirst({
      where: { paystackCustomerCode: customerCode },
      select: { id: true },
    });
  }

  if (!user && customerEmail) {
    user = await prisma.user.findUnique({
      where: { email: customerEmail },
      select: { id: true },
    });
  }

  if (!user) {
    console.error("[Paystack Webhook] subscription.disable: cannot resolve user");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "FREE",
      planExpiresAt: null,
      paystackSubscriptionCode: null,
    },
  });

  console.log(`[Paystack Webhook] subscription.disable: downgraded user ${user.id} to FREE`);
}
