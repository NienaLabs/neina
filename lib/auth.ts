import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "@/lib/generated/prisma/client";


const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
      emailAndPassword: { 
    enabled: true, 
  }, 
  socialProviders: { 
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  }, 
  session:{
    cookieCache:{
      enabled:true
    },
     expiresIn: 60 * 60 * 24 * 7,
     disableSessionRefresh: true
  },
   emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            const name = user.name || user.email.split("@")[0]
            await fetch("https://api.brevo.com/v3/smtp/email", {
                  method: "POST",
                 headers: {
                 "accept": "application/json",

                 "content-type": "application/json",
                 "api-key": process.env.BREVO_API_KEY!,
             },
            body: JSON.stringify({
           sender: { name: "John Doe", email: "john@mycompany.com" },
             to: [{ email: "recipient@example.com", name: "Jane" }],
             subject: `Hello ${name}`,
             htmlContent: `<a href={"${url}"}>Click this link to verify your account </a>`,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Email sent:", data))
  .catch((err) => console.error("Error sending email:", err));

        },
        autoSignInAfterVerification: true,
        sendOnSignUp: true}
});