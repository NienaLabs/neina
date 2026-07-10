import { createTRPCRouter, baseProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  initiatePayment,
  generatePaymentLink,
  getPaymentStatus,
  MomoNetwork,
} from "@/lib/moolre";
import { fulfillTransaction, failTransaction } from "@/lib/fulfillment";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { TRPCError } from "@trpc/server";
import {
  PLANS,
  PlanKey,
  CREDIT_PACKS,
  MINUTE_PACKS,
  CreditPackKey,
  MinutePackKey,
} from "@/lib/plans";

/**
 * What the user is buying. The client only sends keys — prices are always
 * resolved server-side from lib/plans.ts so amounts cannot be tampered with.
 */
const purchaseSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SUBSCRIPTION"),
    plan: z.enum(["SILVER", "GOLD", "DIAMOND"]),
  }),
  z.object({
    type: z.literal("CREDIT_PURCHASE"),
    packKey: z.enum(["CREDITS_10", "CREDITS_20", "CREDITS_30", "CREDITS_50"]),
  }),
  z.object({
    type: z.literal("MINUTE_PURCHASE"),
    packKey: z.enum(["MINUTES_15"]),
  }),
]);

type PurchaseInput = z.infer<typeof purchaseSchema>;

interface ResolvedPurchase {
  amountGHS: number;
  plan?: PlanKey;
  credits?: number;
  minutes?: number;
  description: string;
}

function resolvePurchase(purchase: PurchaseInput): ResolvedPurchase {
  switch (purchase.type) {
    case "SUBSCRIPTION": {
      const plan = PLANS[purchase.plan];
      return {
        amountGHS: plan.priceVal,
        plan: purchase.plan,
        description: `Niena ${plan.name} Plan (30 days)`,
      };
    }
    case "CREDIT_PURCHASE": {
      const pack = CREDIT_PACKS[purchase.packKey as CreditPackKey];
      return {
        amountGHS: pack.priceGHS,
        credits: pack.credits,
        description: `Niena ${pack.credits} Resume Credits`,
      };
    }
    case "MINUTE_PURCHASE": {
      const pack = MINUTE_PACKS[purchase.packKey as MinutePackKey];
      return {
        amountGHS: pack.priceGHS,
        minutes: pack.minutes,
        description: `Niena ${pack.minutes} Interview Minutes`,
      };
    }
  }
}

/**
 * Normalizes a Ghanaian phone number to international digits (233XXXXXXXXX),
 * the format Moolre reports payers in.
 */
function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return `233${digits}`;
}

/** Creates a PENDING transaction row for a resolved purchase. */
async function createPendingTransaction(
  userId: string,
  purchase: PurchaseInput,
  resolved: ResolvedPurchase,
  extraMetadata: Record<string, unknown>
) {
  const reference = `niena_${randomUUID()}`;
  await prisma.transaction.create({
    data: {
      reference,
      userId,
      amount: Math.round(resolved.amountGHS * 100), // stored in pesewas
      currency: "GHS",
      type: purchase.type,
      status: "PENDING",
      plan: resolved.plan,
      credits: resolved.credits,
      minutes: resolved.minutes,
      provider: "MOOLRE",
      metadata: {
        userId,
        type: purchase.type,
        plan: resolved.plan,
        credits: resolved.credits,
        minutes: resolved.minutes,
        ...extraMetadata,
      },
    },
  });
  return reference;
}


export const paymentRouter = createTRPCRouter({
  /** Returns plan and top-up pack data — used to display pricing on the client. */
  getPlans: baseProcedure.query(() => {
    return { plans: PLANS, creditPacks: CREDIT_PACKS, minutePacks: MINUTE_PACKS };
  }),

  /**
   * Initiates a direct mobile money charge via Moolre Collections.
   *
   * Moolre sends a USSD approval prompt to the payer's phone. The charge is
   * asynchronous — the client polls checkTransaction until the payer approves.
   *
   * OTP flow: Moolre may require a one-time SMS verification for a payer
   * (response code TP14). We return { status: "otp_required" } along with the
   * pending reference; the client re-calls this procedure with the same
   * reference plus the otpcode, and we reuse the existing transaction row.
   */
  initiateMomoPayment: protectedProcedure
    .input(
      z.object({
        purchase: purchaseSchema,
        phone: z
          .string()
          .min(9)
          .max(15)
          .regex(/^[+\d\s-]+$/, "Invalid phone number"),
        network: z.enum(["MTN", "TELECEL", "AT"]),
        otpcode: z.string().optional(),
        /** Present only on OTP retry — reuses the pending transaction */
        reference: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const rateLimitRes = await rateLimit(`payment:${userId}`, 5, 60);
      if (!rateLimitRes.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many payment attempts. Please try again later.",
        });
      }

      const resolved = resolvePurchase(input.purchase);
      const payer = normalizeGhanaPhone(input.phone);

      let reference = input.reference;
      if (reference) {
        // OTP retry — the transaction must exist, be PENDING, and belong to this user
        const existing = await prisma.transaction.findUnique({
          where: { reference },
          select: { userId: true, status: true },
        });
        if (!existing || existing.userId !== userId || existing.status !== "PENDING") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid payment reference" });
        }
      } else {
        reference = await createPendingTransaction(userId, input.purchase, resolved, {
          flow: "momo",
          payer,
          network: input.network,
        });
      }

      const result = await initiatePayment({
        payer,
        network: input.network as MomoNetwork,
        amount: resolved.amountGHS,
        externalref: reference,
        otpcode: input.otpcode,
        reference: resolved.description,
      });

      if (result.kind === "otp_required") {
        return { status: "otp_required" as const, reference, message: result.message };
      }

      if (result.kind === "error") {
        await failTransaction(reference);
        throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
      }

      return { status: "sent" as const, reference };
    }),

  /**
   * Creates a hosted Moolre Web POS checkout page (cards + all momo networks).
   * The payer is redirected to Moolre, then back to /pricing/verify.
   * Fulfillment happens via the webhook or the verify page's status poll.
   */
  initiateHostedCheckout: protectedProcedure
    .input(z.object({ purchase: purchaseSchema }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const rateLimitRes = await rateLimit(`payment:${userId}`, 5, 60);
      if (!rateLimitRes.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many payment attempts. Please try again later.",
        });
      }

      const resolved = resolvePurchase(input.purchase);
      const reference = await createPendingTransaction(userId, input.purchase, resolved, {
        flow: "hosted",
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const link = await generatePaymentLink({
        amount: resolved.amountGHS,
        email: ctx.session.user.email,
        externalref: reference,
        redirect: `${baseUrl}/pricing/verify?reference=${reference}&from=/pricing`,
        callback: `${baseUrl}/api/webhooks/moolre`,
        metadata: { userId, reference },
      });

      return { url: link.authorization_url, reference };
    }),

  /**
   * Checks (and if paid, fulfills) a Moolre transaction by our reference.
   * Called by the momo dialog poller and the /pricing/verify page.
   * Verification always goes to Moolre's status API — never client input.
   */
  checkTransaction: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ input }) => {
      const transaction = await prisma.transaction.findUnique({
        where: { reference: input.reference },
        select: { status: true },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      }

      if (transaction.status === "SUCCESS") {
        return { status: "SUCCESS" as const };
      }
      if (transaction.status === "FAILED") {
        return { status: "FAILED" as const, message: "Payment failed" };
      }

      const statusRes = await getPaymentStatus(input.reference);

      if (statusRes.kind === "success") {
        await fulfillTransaction(input.reference);
        return { status: "SUCCESS" as const };
      }
      if (statusRes.kind === "failed") {
        await failTransaction(input.reference);
        return { status: "FAILED" as const, message: statusRes.message };
      }
      return { status: "PENDING" as const };
    }),

  /**
   * Cancels the current user's plan.
   *
   * Moolre payments are one-time 30-day passes (no recurring billing), so
   * cancelling simply downgrades to FREE immediately. Unused credits and
   * interview minutes are kept.
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        plan: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    if (user.plan === "FREE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You don't have an active plan to cancel.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "FREE",
        planExpiresAt: null,
      },
    });

    return { success: true };
  }),
});
