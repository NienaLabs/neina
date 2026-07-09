import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend"
import { EmailTemplate } from "@daveyplate/better-auth-ui/server"
import prisma from "@/lib/prisma";
import { PLANS, PlanKey } from "@/lib/plans";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [],
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