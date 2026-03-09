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
import { PLANS, PlanKey, POLAR_PRODUCT_IDS, PAYSTACK_PLAN_CODES, POLAR_TOPUP_PRODUCT_IDS } from "@/lib/plans";
import { Polar } from "@polar-sh/sdk";

/**
 * Creates an authenticated Polar SDK instance pointing to the correct
 * environment (sandbox vs. production) based on NODE_ENV.
 */
function createPolarClient() {
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  });
}

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
   * Verifies a Polar checkout by its checkout ID.
   * Called from the /pricing/verify page when checkout_id is present in the URL.
   *
   * Note: Plan/credit fulfillment is handled by the Polar webhook (onOrderPaid in auth.tsx).
   * This procedure just confirms the checkout status for the UI — does NOT re-apply credits.
   */
  verifyPolarCheckout: protectedProcedure
    .input(z.object({ checkoutId: z.string() }))
    .mutation(async ({ input }) => {
      const polar = createPolarClient();

      try {
        const checkout = await polar.checkouts.get({ id: input.checkoutId });

        if (checkout.status === "confirmed" || checkout.status === "succeeded") {
          return { status: "SUCCESS" };
        }

        if (checkout.status === "failed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Checkout payment failed. Please try again.",
          });
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Checkout not yet confirmed. Please wait a moment.",
        });
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to verify checkout",
        });
      }
    }),

  /**
   * Creates or retrieves a Polar checkout/portal session for international users.
   *
   * - Active subscription → redirect to customer portal to manage it.
   * - No subscription → create a new checkout for the requested plan.
   *
   * Passes customerExternalId = user.id so Polar links the purchase to the
   * correct user (matching the customer created via createCustomerOnSignUp).
   */
  managePolarSubscription: protectedProcedure
    .input(z.object({ plan: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const polar = createPolarClient();

      if (user.polarSubscriptionId) {
        try {
          const subscription = await polar.subscriptions.get({ id: user.polarSubscriptionId });
          if (subscription.status === "active" || subscription.status === "past_due") {
            const portalSession = await polar.customerSessions.create({
              customerId: user.polarCustomerId!,
            });
            return { type: "portal" as const, url: portalSession.customerPortalUrl };
          }
        } catch {
          // Subscription may have been revoked on Polar's end — fall through to checkout
        }
      }

      const planKey = input.plan as keyof typeof POLAR_PRODUCT_IDS;
      const productId = POLAR_PRODUCT_IDS[planKey];

      if (!productId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid plan selected for international payment",
        });
      }

      const checkout = await polar.checkouts.create({
        productId: productId,
        customerEmail: user.email,
        customerExternalId: user.id,
        customerId: user.polarCustomerId || undefined,
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing/verify?checkout_id={CHECKOUT_ID}`,
      });

      await prisma.transaction.create({
        data: {
          reference: checkout.id,
          userId: user.id,
          amount: PLANS[planKey as PlanKey]?.priceValUSD ?? 0,
          type: "SUBSCRIPTION",
          status: "PENDING",
          plan: planKey as any,
          provider: "POLAR",
          polarCheckoutId: checkout.id,
          currency: "USD",
        },
      });

      return { type: "checkout" as const, url: checkout.url };
    }),

  /**
   * Initiates a one-time Polar checkout for a credit or minute top-up.
   * Used by international (USD/Polar) users to purchase credits/minutes à la carte.
   *
   * Each topUpKey maps to a ONE-TIME product in the Polar dashboard.
   * Fulfillment is handled by the onOrderPaid webhook in auth.tsx.
   *
   * Required env vars (one product per pack size):
   *   POLAR_PRODUCT_CREDITS_10, POLAR_PRODUCT_CREDITS_20,
   *   POLAR_PRODUCT_CREDITS_30, POLAR_PRODUCT_CREDITS_50,
   *   POLAR_PRODUCT_MINUTES_15
   */
  initiatePolarTopUp: protectedProcedure
    .input(
      z.object({
        topUpKey: z.enum(["CREDITS_10", "CREDITS_20", "CREDITS_30", "CREDITS_50", "MINUTES_15"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const polar = createPolarClient();

      const productId = POLAR_TOPUP_PRODUCT_IDS[input.topUpKey];
      if (!productId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Product not configured for ${input.topUpKey}. Add POLAR_PRODUCT_${input.topUpKey} to your env vars.`,
        });
      }

      const checkout = await polar.checkouts.create({
        productId,
        customerEmail: user.email,
        customerExternalId: user.id,
        customerId: user.polarCustomerId || undefined,
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing/verify?checkout_id={CHECKOUT_ID}`,
      });

      const creditAmounts: Record<string, number> = {
        CREDITS_10: 10, CREDITS_20: 20, CREDITS_30: 30, CREDITS_50: 50,
      };
      const credits = creditAmounts[input.topUpKey] ?? null;
      const minutes = input.topUpKey === "MINUTES_15" ? 15 : null;

      await prisma.transaction.create({
        data: {
          reference: checkout.id,
          userId: user.id,
          amount: 0, // Actual amount set by Polar product price
          type: credits ? "CREDIT_PURCHASE" : "MINUTE_PURCHASE",
          status: "PENDING",
          provider: "POLAR",
          polarCheckoutId: checkout.id,
          currency: "USD",
          ...(credits ? { credits } : {}),
          ...(minutes ? { minutes } : {}),
        },
      });

      return { url: checkout.url };
    }),

  /**
   * Cancels the current user's active subscription.
   *
   * Handles both providers:
   *   - Polar: calls polar.subscriptions.cancel()
   *   - Paystack: calls the subscription disable API
   *
   * Immediately sets plan = FREE in DB.
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        plan: true,
        polarSubscriptionId: true,
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

    if (user.polarSubscriptionId) {
      const polar = createPolarClient();
      try {
        await polar.subscriptions.cancel({ id: user.polarSubscriptionId });
      } catch (err: any) {
        console.warn("[cancelSubscription] Polar cancel error (may already be canceled):", err.message);
      }
    }

    if (user.paystackSubscriptionCode) {
      try {
        const sub = await getSubscription(user.paystackSubscriptionCode);
        await cancelPaystackSubscription(sub.subscription_code, sub.email_token);
      } catch (err: any) {
        console.warn("[cancelSubscription] Paystack cancel error:", err.message);
      }
    }

    if (!user.polarSubscriptionId && !user.paystackSubscriptionCode) {
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
        polarSubscriptionId: null,
        paystackSubscriptionCode: null,
      },
    });

    return { success: true };
  }),
});
