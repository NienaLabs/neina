import "server-only";

import prisma from "@/lib/prisma";
import { PLANS, PlanKey } from "@/lib/plans";

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
  return true;
}

/** Marks a transaction FAILED (only if still pending). */
export async function failTransaction(reference: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: { reference, status: "PENDING" },
    data: { status: "FAILED" },
  });
}
