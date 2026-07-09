import { createTRPCRouter, baseProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import {
  initializeTransaction,
  verifyTransaction,
  cancelPaystackSubscription,
  getSubscription,
  listCustomerSubscriptions,
} from "@/lib/paystack";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { TRPCError } from "@trpc/server";
import { PLANS, PlanKey, PAYSTACK_PLAN_CODES } from "@/lib/plans";

export const paymentRouter = createTRPCRouter({
  /** Returns the full plan data — used to display pricing info on the client. */
  getPlans: baseProcedure.query(() => {
    return PLANS;
  }),

  /**
   * Initiates a Paystack payment transaction.
   *
   * For SUBSCRIPTION type: passes the Paystack Plan code so the transaction
   * auto-creates a recurring monthly subscription on success.
   * For CREDIT_PURCHASE and MINUTE_PURCHASE: one-time charges.
   */
  initiateTransaction: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        email: z.email(),
        type: z.enum(["SUBSCRIPTION", "CREDIT_PURCHASE", "MINUTE_PURCHASE"]),
        plan: z.enum(["FREE", "SILVER", "GOLD", "DIAMOND"]).optional(),
        credits: z.number().optional(),
        minutes: z.number().optional(),
        callbackUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rateLimitRes = await rateLimit(`payment:${ctx.session.user.id}`, 3, 60);
      if (!rateLimitRes.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many payment attempts. Please try again later.",
        });
      }

      const metadata = {
        userId: ctx.session.user.id,
        type: input.type,
        plan: input.plan,
        credits: input.credits,
        minutes: input.minutes,
      };

      // For subscription payments, pass the Paystack plan code so Paystack
      // auto-creates a recurring subscription after the first charge succeeds
      const planCode =
        input.type === "SUBSCRIPTION" && input.plan && input.plan !== "FREE"
          ? PAYSTACK_PLAN_CODES[input.plan as keyof typeof PAYSTACK_PLAN_CODES]
          : undefined;

      const txData = await initializeTransaction(
        input.email,
        input.amount,
        input.callbackUrl,
        metadata,
        planCode
      );

      await prisma.transaction.create({
        data: {
          reference: txData.reference,
          userId: ctx.session.user.id,
          amount: input.amount,
          type: input.type,
          status: "PENDING",
          plan: input.plan as any,
          credits: input.credits,
          minutes: input.minutes,
          metadata: metadata,
          provider: "PAYSTACK",
        },
      });

      return txData;
    }),

  /**
   * Verifies a completed Paystack transaction by its reference.
   * On success: upgrades the user's plan/credits and stores the subscription code.
   */
  verifyTransaction: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ input }) => {
      const transaction = await prisma.transaction.findUnique({
        where: { reference: input.reference },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
      }

      if (transaction.status === "SUCCESS") {
        return { status: "SUCCESS", message: "Transaction already processed" };
      }

      const verifyRes = await verifyTransaction(input.reference);

      if (verifyRes.data.status === "success") {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "SUCCESS" },
        });

        if (transaction.type === "SUBSCRIPTION" && transaction.plan) {
          const planData = PLANS[transaction.plan as PlanKey];
          await prisma.user.update({
            where: { id: transaction.userId },
            data: {
              plan: transaction.plan,
              resume_credits: { increment: planData.credits },
              interview_minutes: { increment: planData.minutes },
              planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paystackSubscriptionCode: verifyRes.data.subscription_code ?? undefined,
              paystackCustomerCode: String(verifyRes.data.customer?.customer_code ?? ""),
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

        return { status: "SUCCESS" };
      } else {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment failed verification",
        });
      }
    }),



  /**
   * Cancels the current user's active subscription.
   *
   * Handles Paystack by calling the subscription disable API
   *
   * Immediately sets plan = FREE in DB.
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        plan: true,
        paystackSubscriptionCode: true,
        email: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    if (user.plan === "FREE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You don't have an active subscription to cancel.",
      });
    }

    if (user.paystackSubscriptionCode) {
      try {
        const sub = await getSubscription(user.paystackSubscriptionCode);
        await cancelPaystackSubscription(sub.subscription_code, sub.email_token);
      } catch (err: any) {
        console.warn("[cancelSubscription] Paystack cancel error:", err.message);
      }
    }

    if (!user.paystackSubscriptionCode) {
      try {
        const subs = await listCustomerSubscriptions(user.email);
        const activeSub = subs.find((s) => s.status === "active");
        if (activeSub) {
          await cancelPaystackSubscription(activeSub.subscription_code, activeSub.email_token);
          await prisma.user.update({
            where: { id: user.id },
            data: { paystackSubscriptionCode: activeSub.subscription_code },
          });
        }
      } catch (err: any) {
        console.warn("[cancelSubscription] Could not look up Paystack subscriptions:", err.message);
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "FREE",
        planExpiresAt: null,
        paystackSubscriptionCode: null,
      },
    });

    return { success: true };
  }),
});
