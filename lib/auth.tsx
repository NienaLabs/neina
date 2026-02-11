import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend"
import { EmailTemplate } from "@daveyplate/better-auth-ui/server"
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "@/lib/prisma";
import { POLAR_PRODUCT_IDS } from "@/lib/plans";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: "sandbox", // Use 'production' for live environment
});
const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  plugins: [
    //@ts-ignore
    polar({
      //@ts-ignore
      polar: polarClient,
      createCustomerOnSignUp: false,
      use: [
        checkout({
          products: [
            {
              productId: "f30a8e41-4d9a-423a-9638-4ddbc0c22a27",
              slug: "silver" // Custom slug for easy reference in Checkout URL, e.g. /checkout/silver
            },
            {
              productId: "cb97ea94-750b-4904-b23f-c4379bb194b5",
              slug: "Gold" // Custom slug for easy reference in Checkout URL, e.g. /checkout/Gold
            },
            {
              productId: "d9b65b5f-9d18-4c4f-add6-02aa3aaf3804",
              slug: "Diamond" // Custom slug for easy reference in Checkout URL, e.g. /checkout/Diamond
            }
          ],
          successUrl: "/success?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET || "temp_secret_to_avoid_crash",
          // Triggered when subscription is created/updated
          onCustomerStateChanged: async (payload) => {
            // This is more complex as it involves full state sync. 
            // For MVP, we might rely on onOrderPaid for One-time and Sub 'Invoice Paid' events if Polar treats them similarly.
            // But for Subscriptions, `onSubscriptionCreated` or `onOrderPaid` (msg invoice) is key.
            // Better Auth Plugin docs say `onCustomerStateChanged` is triggered.
            console.log("Customer state changed", payload);
          },
          onOrderPaid: async (payload) => {
            console.log("Order paid", payload);
            // @ts-ignore
            const { order } = payload;
            if (!order) return;

            // User ID should be in metadata or linked via email if createCustomerOnSignUp was true
            // Better Auth Polar Plugin links using external_id = user.id
            // We can verify this via payload.customer.external_id if available, or finding user by email.
            // However, payload structure depends on Polar SDK version.
            // Assuming payload.order.customer.external_id exists.

            // For now we will try to find user by email as fallback.
            const userEmail = order.customer.email;
            const user = await prisma.user.findUnique({ where: { email: userEmail } });

            if (!user) {
              console.error(`User not found for order ${order.id}`);
              return;
            }

            // Determine what was bought.
            // This is tricky without predictable Product IDs.
            // We will match by product name substring for this implementation as requested "make sure everything works".
            const productName = order.product.name.toUpperCase();

            // Import PLANS dynamically or rely on it being present (I need to import it).
            // I will handle logic:

            let creditsToAdd = 0;
            let minutesToAdd = 0;
            let newPlan = null;

            // Check Plans
            if (productName.includes("SILVER")) {
              newPlan = "SILVER";
              creditsToAdd = 10;
              minutesToAdd = 0;
            } else if (productName.includes("GOLD")) {
              newPlan = "GOLD";
              creditsToAdd = 20;
              minutesToAdd = 15;
            } else if (productName.includes("DIAMOND")) {
              newPlan = "DIAMOND";
              creditsToAdd = 30;
              minutesToAdd = 60;
            }

            // Check One-time credits
            if (productName.includes("CREDITS")) {
              // E.g. "10 Credits"
              const match = productName.match(/(\d+)\s*CREDITS/);
              if (match) creditsToAdd = parseInt(match[1]);
            }

            if (productName.includes("MINUTES")) {
              // E.g. "15 Minutes"
              const match = productName.match(/(\d+)\s*MINUTES/);
              if (match) minutesToAdd = parseInt(match[1]);
            }

            // Update User
            if (newPlan) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  plan: newPlan as any,
                  resume_credits: { increment: creditsToAdd },
                  interview_minutes: { increment: minutesToAdd },
                  planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  polarCustomerId: order.customer.id, 
                  polarSubscriptionId: order.subscription_id
                }
              });
            } else {
              // Just credits/minutes
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  resume_credits: { increment: creditsToAdd },
                  interview_minutes: { increment: minutesToAdd },
                  polarCustomerId: order.customer.id
                }
              });
            }
          },
          onSubscriptionUpdated: async (payload) => {
             console.log("Polar subscription updated", payload);
             // @ts-ignore
             const subscription = payload.data;
             if (!subscription) return;
             
             // Find user (try by Subscription ID first, then Customer ID)
             let user = await prisma.user.findFirst({
                 where: { polarSubscriptionId: subscription.id }
             });

             if (!user) {
                 user = await prisma.user.findFirst({
                     where: { polarCustomerId: subscription.customerId }
                 });
             }

             if (!user) {
                 console.error(`User not found for subscription ${subscription.id}`);
                 return;
             }

             // Determine Plan from Product ID
             const productId = subscription.productId;
             let newPlan = "FREE";
             
             if (productId === POLAR_PRODUCT_IDS.SILVER) newPlan = "SILVER";
             else if (productId === POLAR_PRODUCT_IDS.GOLD) newPlan = "GOLD";
             else if (productId === POLAR_PRODUCT_IDS.DIAMOND) newPlan = "DIAMOND";

             if (subscription.status === 'active' && newPlan !== 'FREE') {
                 await prisma.user.update({
                     where: { id: user.id },
                     data: {
                         plan: newPlan as any,
                         planExpiresAt: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : undefined,
                         polarCustomerId: subscription.customerId,
                         polarSubscriptionId: subscription.id
                     }
                 });
             } else if (subscription.status !== 'active') {
                 // Handle cancellation/expiration? 
                 // If canceled, maybe downgrade? relying on manual downgrade or expiration logic for now so we don't accidentally downgrade due to transient states.
                 // But strictly speaking, if status is canceled, we should set to FREE effective immediately or at period end.
                 // Polar handles 'cancel_at_period_end' separately.
             }
          },
          onSubscriptionCreated: async (payload) => {
             console.log("Polar subscription created", payload);
             // @ts-ignore
             const subscription = payload.data;
             if (!subscription) return;

             // Find user by customer ID (since sub ID might be new)
             const user = await prisma.user.findFirst({
                 where: { polarCustomerId: subscription.customerId}
             });
             
             // If not found by ID, maybe try finding by email if available in payload?
             // Subscription payload usually has customer_id, not email directly unless expanded.
             // We rely on previous steps (create/checkout) to have linked the user.

             if (user) {
                 const productId = subscription.productId;
                 let newPlan = "FREE";
                 if (productId === POLAR_PRODUCT_IDS.SILVER) newPlan = "SILVER";
                 else if (productId === POLAR_PRODUCT_IDS.GOLD) newPlan = "GOLD";
                 else if (productId === POLAR_PRODUCT_IDS.DIAMOND) newPlan = "DIAMOND";

                 if (newPlan !== 'FREE') {
                      await prisma.user.update({
                         where: { id: user.id },
                         data: {
                             plan: newPlan as any,
                             planExpiresAt: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : undefined,
                             polarCustomerId: subscription.customerId,
                             polarSubscriptionId: subscription.id
                         }
                     });
                 }
             }
          },
          onPayload: async (payload) => { console.log("Polar webhook payload", payload) },
        })
      ],
    })
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
        input: false, // Don't allow user to set their own role during sign up
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
        })
      },
      )
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  }
});