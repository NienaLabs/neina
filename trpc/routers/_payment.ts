import { createTRPCRouter, baseProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit"; // Usage depends on how we implemented it
import { TRPCError } from "@trpc/server";

// Plan Data
const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    features: ["1 resume upload", "10 job matches/week", "3 Resume AI credits/month"],
    credits: 3,
    minutes: 0,
    matches: 10,
  },
  SILVER: {
    name: "Silver",
    price: 2900, // in cents ($29.00)
    features: ["30 job matches/week", "10 Resume AI credits/month"],
    credits: 10,
    minutes: 0,
    matches: 30,
  },
  GOLD: {
    name: "Gold",
    price: 4900, // in cents ($49.00)
    features: ["60 job matches/week", "20 Resume AI credits/month", "15 interview mins/month"],
    credits: 20,
    minutes: 15,
    matches: 60,
  },
  DIAMOND: {
    name: "Diamond",
    price: 9900, // in cents ($99.00)
    features: ["Unlimited matches", "30 Resume AI credits/month", "60 interview mins/month"],
    credits: 30,
    minutes: 60,
    matches: 1000,
  },
};

type PlanKey = keyof typeof PLANS;

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
  cancelSubscription: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Downgrade user to FREE plan
      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          plan: "FREE",
          planExpiresAt: null, // Clear expiration or should we let it expire? 
          // If cancelling means "I don't want this anymore", usually for one-time sub it means effectively nothing unless we refund.
          // But user asked for "ability to cancel". I'll reset to FREE.
        },
      });
      return { success: true };
    }),
});
