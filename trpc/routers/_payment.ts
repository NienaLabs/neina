import { createTRPCRouter, baseProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit"; // Usage depends on how we implemented it
import { TRPCError } from "@trpc/server";

// Plan Data
import { PLANS, PlanKey } from "@/lib/plans";

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
