import "server-only";

import prisma from "@/lib/prisma";
import { PLANS, PlanKey } from "@/lib/plans";
import { sendSms } from "@/lib/moolre-sms";

/**
 * Marks a transaction SUCCESS and grants the purchase to the user
 * (plan upgrade, resume credits, or interview minutes).
 *
 * Idempotent: the PENDING → SUCCESS flip is done with updateMany so that if
 * the webhook and the client-side verify poll race each other, only one of
 * them applies the grant.
 *
 * Returns true if this call performed the fulfillment, false if the
 * transaction was already processed (or unknown).
 */
export async function fulfillTransaction(reference: string): Promise<boolean> {
  const claimed = await prisma.transaction.updateMany({
    where: { reference, status: "PENDING" },
    data: { status: "SUCCESS" },
  });
  if (claimed.count === 0) return false;

  const transaction = await prisma.transaction.findUnique({
    where: { reference },
  });
  if (!transaction) return false;

  if (transaction.type === "SUBSCRIPTION" && transaction.plan) {
    const planData = PLANS[transaction.plan as PlanKey];
    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        plan: transaction.plan,
        resume_credits: { increment: planData.credits },
        interview_minutes: { increment: planData.minutes },
        // Moolre has no recurring billing — a plan purchase is a 30-day pass
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } else if (transaction.type === "CREDIT_PURCHASE" && transaction.credits) {
    await prisma.user.update({
      where: { id: transaction.userId },
      data: { resume_credits: { increment: transaction.credits } },
    });
  } else if (transaction.type === "MINUTE_PURCHASE" && transaction.minutes) {
    await prisma.user.update({
      where: { id: transaction.userId },
      data: { interview_minutes: { increment: transaction.minutes } },
    });
  }

  console.log(
    `[Moolre] Fulfilled ${transaction.type} for user ${transaction.userId} (ref ${reference})`
  );

  // Best-effort receipt via Moolre SMS — momo purchases carry the payer's
  // number in metadata; a send failure must never fail the fulfillment.
  const payer = (transaction.metadata as { payer?: string } | null)?.payer;
  if (payer) {
    const amountGHS = (transaction.amount / 100).toFixed(2);
    const what =
      transaction.type === "SUBSCRIPTION" && transaction.plan
        ? `${PLANS[transaction.plan as PlanKey].name} Plan (30 days)`
        : transaction.type === "CREDIT_PURCHASE"
          ? `${transaction.credits} resume credits`
          : `${transaction.minutes} interview minutes`;
    // Awaited because serverless functions freeze after responding — a voided
    // promise would often never complete. sendSms never throws.
    await sendSms({
      recipient: payer,
      message: `Payment received: GHS ${amountGHS} for ${what}. Your Niena account has been updated. Thank you!`,
      ref: reference,
    });
  }

  return true;
}

/** Marks a transaction FAILED (only if still pending). */
export async function failTransaction(reference: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: { reference, status: "PENDING" },
    data: { status: "FAILED" },
  });
}
