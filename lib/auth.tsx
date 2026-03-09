import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend"
import { EmailTemplate } from "@daveyplate/better-auth-ui/server"
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import prisma from "@/lib/prisma";
import { POLAR_PRODUCT_IDS, PLANS, PlanKey, POLAR_TOPUP_PRODUCT_IDS } from "@/lib/plans";

/**
 * Polar SDK client — switches between sandbox and production based on NODE_ENV.
 * Access tokens are environment-specific: sandbox tokens only work in sandbox,
 * production tokens only work in production.
 */
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Resolves our internal PlanKey from a Polar product ID.
 * Returns null if the product is not a subscription plan.
 */
function resolvePlanFromProductId(productId: string): PlanKey | null {
  if (productId === POLAR_PRODUCT_IDS.SILVER) return "SILVER";
  if (productId === POLAR_PRODUCT_IDS.GOLD) return "GOLD";
  if (productId === POLAR_PRODUCT_IDS.DIAMOND) return "DIAMOND";
  return null;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    //@ts-ignore
    polar({
      //@ts-ignore
      polar: polarClient,
      /**
       * Create a Polar customer (with externalId = user.id) on sign up.
       * This is critical: it allows all webhook handlers to reliably look up
       * our user via payload.data.customer.externalId instead of email.
       */
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: POLAR_PRODUCT_IDS.SILVER,
              slug: "silver",
            },
            {
              productId: POLAR_PRODUCT_IDS.GOLD,
              slug: "gold",
            },
            {
              productId: POLAR_PRODUCT_IDS.DIAMOND,
              slug: "diamond",
            }
          ],
          /**
           * After a successful Polar checkout, redirect to our verify page.
           * The {CHECKOUT_ID} placeholder is replaced by Polar with the actual checkout ID.
           */
          successUrl: "/pricing/verify?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,

          /**
           * Fired when an order is paid — this covers:
           *   - New subscription first payment
           *   - Recurring subscription renewal charges
           *
           * We use customer.externalId (= our user.id set during createCustomerOnSignUp)
           * as the reliable user lookup key. This avoids email-based lookups that can
           * fail when Polar hasn't synced the email or when emails don't match exactly.
           */
          onOrderPaid: async (payload) => {
            const order = (payload as any).data;
            if (!order) return;

            const externalId = order.customer?.externalId;
            if (!externalId) {
              console.error("[Polar] onOrderPaid: no externalId on customer. Order ID:", order.id);
              return;
            }

            const productId: string = order.product?.id ?? "";
            const planKey = resolvePlanFromProductId(productId);
            if (!planKey) {
              // Check if it's a one-time top-up product
              const topUpCreditMap: Record<string, number> = {
                [POLAR_TOPUP_PRODUCT_IDS.CREDITS_10]: 10,
                [POLAR_TOPUP_PRODUCT_IDS.CREDITS_20]: 20,
                [POLAR_TOPUP_PRODUCT_IDS.CREDITS_30]: 30,
                [POLAR_TOPUP_PRODUCT_IDS.CREDITS_50]: 50,
              };
              const topUpMinuteMap: Record<string, number> = {
                [POLAR_TOPUP_PRODUCT_IDS.MINUTES_15]: 15,
              };

              if (topUpCreditMap[productId] !== undefined) {
                await prisma.user.update({
                  where: { id: externalId },
                  data: { resume_credits: { increment: topUpCreditMap[productId] } },
                });
                await prisma.transaction.updateMany({
                  where: { polarCheckoutId: order.id, userId: externalId },
                  data: { status: "SUCCESS" },
                });
                console.log(`[Polar] onOrderPaid: added ${topUpCreditMap[productId]} credits to user ${externalId}`);
              } else if (topUpMinuteMap[productId] !== undefined) {
                await prisma.user.update({
                  where: { id: externalId },
                  data: { interview_minutes: { increment: topUpMinuteMap[productId] } },
                });
                await prisma.transaction.updateMany({
                  where: { polarCheckoutId: order.id, userId: externalId },
                  data: { status: "SUCCESS" },
                });
                console.log(`[Polar] onOrderPaid: added ${topUpMinuteMap[productId]} minutes to user ${externalId}`);
              } else {
                console.log("[Polar] onOrderPaid: no matching plan or top-up for productId", productId);
              }
              return;
            }

            const planData = PLANS[planKey];

            await prisma.user.update({
              where: { id: externalId },
              data: {
                plan: planKey,
                resume_credits: { increment: planData.credits },
                interview_minutes: { increment: planData.minutes },
                // Set expiry to 30 days from now; onSubscriptionUpdated will sync actual period end
                planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                polarCustomerId: order.customer?.id ?? undefined,
                polarSubscriptionId: order.subscriptionId ?? undefined,
              },
            });

            console.log(`[Polar] onOrderPaid: upgraded user ${externalId} to ${planKey}`);
          },

          /**
           * Fired when subscription status changes (renewal, plan change, status update).
           * Used to keep planExpiresAt in sync with the actual billing period end.
           * Only acts when the subscription is in "active" state.
           */
          onSubscriptionUpdated: async (payload) => {
            const sub = (payload as any).data;
            if (!sub) return;

            const externalId = sub.customer?.externalId;
            if (!externalId) {
              console.error("[Polar] onSubscriptionUpdated: no externalId on customer. Sub ID:", sub.id);
              return;
            }

            // Only sync active subscriptions
            if (sub.status !== "active") return;

            const productId: string = sub.product?.id ?? sub.productId ?? "";
            const planKey = resolvePlanFromProductId(productId);
            if (!planKey) return;

            await prisma.user.update({
              where: { id: externalId },
              data: {
                plan: planKey,
                planExpiresAt: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : undefined,
                polarSubscriptionId: sub.id,
                polarCustomerId: sub.customerId ?? sub.customer?.id ?? undefined,
              },
            });

            console.log(`[Polar] onSubscriptionUpdated: synced user ${externalId} plan=${planKey}`);
          },

          /**
           * Fired when a subscription is canceled (at period end — user still has access).
           * We log this but do NOT downgrade immediately; access continues until period end.
           * The definitive downgrade happens in onSubscriptionRevoked.
           */
          onSubscriptionCanceled: async (payload) => {
            const sub = (payload as any).data;
            const externalId = sub?.customer?.externalId;
            console.log(`[Polar] onSubscriptionCanceled: user ${externalId ?? "unknown"}, sub ${sub?.id}`);
          },

          /**
           * Fired when subscription access is definitively ended:
           *   - Immediate cancellation, OR
           *   - End-of-period cancellation (billing period expired)
           *
           * This is the ONLY handler that actually downgrades the user to FREE.
           */
          onSubscriptionRevoked: async (payload) => {
            const sub = (payload as any).data;
            if (!sub) return;

            const externalId = sub.customer?.externalId;
            if (!externalId) {
              console.error("[Polar] onSubscriptionRevoked: no externalId on customer. Sub ID:", sub.id);
              return;
            }

            await prisma.user.update({
              where: { id: externalId },
              data: {
                plan: "FREE",
                planExpiresAt: null,
                polarSubscriptionId: null,
              },
            });

            console.log(`[Polar] onSubscriptionRevoked: downgraded user ${externalId} to FREE`);
          },

          /**
           * Catch-all for debugging — logs every incoming event.
           */
          onPayload: async (payload) => {
            if (process.env.NODE_ENV !== "production") {
              console.log("[Polar] Raw webhook payload event type:", (payload as any).type ?? "unknown");
            }
          },
        }),
      ],
    }),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      const name = user.name || user.email.split("@")[0]
      await resend.emails.send({
        from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
        to: user.email,
        subject: "Reset your password",
        react: EmailTemplate({
          action: "Reset Password",
          content: (
            <>
              <p> Hello {name}</p>
              <p>Click the button below to reset your password.</p>
            </>
          ),
          heading: "Reset Password",
          siteName: "Niena",
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
          url
        })
      })
    }
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      isSuspended: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      goal: { type: "string", required: false },
      referralSource: { type: "string", required: false },
      jobTitle: { type: "string", required: false },
      experienceLevel: { type: "string", required: false },
      selectedTopics: { type: "string[]", required: false },
      location: { type: "string", required: false },
      jobType: { type: "string", required: false },
      remotePreference: { type: "string", required: false },
      companyName: { type: "string", required: false },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const name = user.name || user.email.split("@")[0]
      await resend.emails.send({
        from: `Niena Labs <${process.env.RESEND_FROM_EMAIL}>`,
        to: user.email,
        subject: "Verify your email address",
        react: EmailTemplate({
          action: "Verify Email",
          content: (
            <>
              <p>
                Hello {name}
              </p>
              <p>
                Click the button below to verify your email address.
              </p>
            </>
          ),
          heading: "Verify Email",
          siteName: "Niena",
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
          url
        }),
      })
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  }
});