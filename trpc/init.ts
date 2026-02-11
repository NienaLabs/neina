import { auth } from '@/lib/auth';
import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
import { headers } from 'next/headers'
import prisma from "@/lib/prisma";

export const createTRPCContext = cache(async () => {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    return { session };
  } catch (error) {
    console.error("❌ [tRPC Context] Failed to get session:", error);
    return { session: null };
  }
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});



const isAuthed = t.middleware(async ({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  const user = ctx.session.user as any; // Type assertion as better-auth types might not reflect custom schema immediately without augmentation

  if (user.isSuspended) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your account has been suspended. Please contact support.',
    });
  }

  // Check Subscription Expiration
  if (user.plan !== "FREE" && user.planExpiresAt) {
    const expiresAt = new Date(user.planExpiresAt);
    if (expiresAt < new Date()) {
      // Downgrade user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "FREE",
          planExpiresAt: null,
          // Optional: Reset credits/minutes or keep them? Usually keep purchased ones, but monthly allowance?
          // For simplicity, we just switch plan to FREE.
        },
      });
      console.log(`User ${user.id} subscription expired. Downgraded to FREE.`);

      // Notify user via SSE (if they are online)
      const { emitUserEvent } = await import('@/lib/events');
      emitUserEvent(user.id, {
        type: 'NEW_NOTIFICATION',
        data: {
          notification: {
            title: 'Subscription Expired',
            content: 'Your subscription has expired and your account has been downgraded to the FREE plan.',
            sentAt: new Date(),
          }
        }
      });

      // Update session user object explicitly so downstream procedures see FREE
      user.plan = "FREE";
      user.planExpiresAt = null;

      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "SUBSCRIPTION_EXPIRED",
      });
    }
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);