import { createTRPCRouter, baseProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit"; // Usage depends on how we implemented it
import { TRPCError } from "@trpc/server";

// Plan Data
import { PLANS, PlanKey, POLAR_PRODUCT_IDS } from "@/lib/plans";
import { Polar } from "@polar-sh/sdk";

export const paymentRouter = createTRPCRouter({
  getPlans: baseProcedure.query(() => {
    return PLANS;
  }),

  initiateTransaction: protectedProcedure
    .input(
      z.object({
        amount: z.number(), // In kobo
        email: z.email(),
        type: z.enum(["SUBSCRIPTION", "CREDIT_PURCHASE", "MINUTE_PURCHASE"]),
        plan: z.enum(["FREE", "SILVER", "GOLD", "DIAMOND"]).optional(),
        credits: z.number().optional(),
        minutes: z.number().optional(),
        callbackUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate Limit
      const rateLimitRes = await rateLimit(`payment:${ctx.session.user.id}`, 3, 60); // 3 attempts per minute
      if (!rateLimitRes.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many payment attempts. Please try again later.",
        });
      }

      // Initialize Paystack
      const metadata = {
        userId: ctx.session.user.id,
        type: input.type,
        plan: input.plan,
        credits: input.credits,
        minutes: input.minutes,
      };

      const paystackRes = await initializeTransaction(input.email, input.amount, input.callbackUrl, metadata);

      if (!paystackRes.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment initialization failed",
        });
      }

      // Create Transaction Record
      await prisma.transaction.create({
        data: {
          reference: paystackRes.data.reference,
          userId: ctx.session.user.id,
          amount: input.amount,
          type: input.type,
          status: "PENDING",
          plan: input.plan as any, // Cast to any or Plan enum (needs import of Plan from prisma, but string matches usually work if enum matches)
          credits: input.credits,
          minutes: input.minutes,
          metadata: metadata,
        },
      });

      return paystackRes.data;
    }),

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
        // Update Transaction
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "SUCCESS" },
        });

        // Fulfill Purchase
        if (transaction.type === "SUBSCRIPTION" && transaction.plan) {
           const planData = PLANS[transaction.plan as PlanKey]; // Use type assertion
           // Update User Plan
           await prisma.user.update({
             where: { id: transaction.userId },
             data: {
               plan: transaction.plan,
               resume_credits: { increment: planData.credits }, 
               interview_minutes: { increment: planData.minutes },
               planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
             }
           });
        } else if (transaction.type === "CREDIT_PURCHASE" && transaction.credits) {
            await prisma.user.update({
                where: { id: transaction.userId },
                data: { resume_credits: { increment: transaction.credits } }
            });
        } else if (transaction.type === "MINUTE_PURCHASE" && transaction.minutes) {
             await prisma.user.update({
                where: { id: transaction.userId },
                data: { interview_minutes: { increment: transaction.minutes } }
            });
        }

        return { status: "SUCCESS" };
      } else {
        await prisma.transaction.update({
             where: { id: transaction.id },
             data: { status: "FAILED" }
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment failed verification" });
      }
    }),
  managePolarSubscription: protectedProcedure
    .input(z.object({ plan: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;
      const polar = new Polar({
        accessToken: process.env.POLAR_ACCESS_TOKEN!,
        server: "sandbox", // TODO: Switch based on env
      });

      // 1. Ensure we have the user's Polar Customer ID
      let customerId = user.polarCustomerId;

      if (!customerId) {
        // Try to find customer by email
        const customers = await polar.customers.list({
          email: user.email,
          limit: 1,
        });

        if (customers.result.items.length > 0) {
            customerId = customers.result.items[0].id;
            // Update user asynchronously (or await if critical)
            await prisma.user.update({
                where: { id: user.id },
                data: { polarCustomerId: customerId },
            });
        }
      }

      // 2. Check for active subscriptions if we have a customer ID
      let hasActiveSubscription = false;
      if (customerId) {
        const subscriptions = await polar.subscriptions.list({
          customerId: customerId,
          active: true, // Only active ones
          limit: 1,
        });
        
        // Check if any returned subscription is actually active (status check usually implied by list parameters but good to be safe)
        hasActiveSubscription = subscriptions.result.items.some(sub => sub.status === 'active');
      }

      // 3. Logic Branch
      if (hasActiveSubscription) {
        // Redirect to Customer Portal
        const portalSession = await polar.customerSessions.create({
            customerId: customerId!,
        });
        return { type: "portal", url: portalSession.customerPortalUrl };
      } else {
        // Create Checkout Session for the requested plan
        const planKey = input.plan as keyof typeof POLAR_PRODUCT_IDS;
        const productId = POLAR_PRODUCT_IDS[planKey];

        if (!productId) {
             throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan selected for international payment" });
        }

        const checkout = await polar.checkouts.create({
            productId: productId,
            customerEmail: user.email,
            successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing/verify?checkout_id={CHECKOUT_ID}`, // We can verify later
            // We can implicitly link user by email or if we had customerId pass it?
            // checking SDK types or docs... usually customerId is optional if email is passed or vice versa.
            // If we have customerId, passing it is better.
            customerId: customerId || undefined,
        });
        
        return { type: "checkout", url: checkout.url };
      }
    }),
});
