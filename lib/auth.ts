import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/lib/generated/prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
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
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }) => {
            const name = user.name || user.email.split("@")[0];
            
            if (!process.env.BREVO_API_KEY) {
                console.error('BREVO_API_KEY is not set in environment variables');
                throw new Error('Email service configuration error');
            }

            const emailData = {
                sender: {
                    name: 'Your App Name',
                    email: 'noreply@yourapp.com' // Replace with your verified sender email
                },
                to: [{
                    email: user.email,
                    name: name
                }],
                subject: 'Verify your email address',
                htmlContent: `
                    <h1>Welcome to Our App, ${name}!</h1>
                    <p>Please verify your email address by clicking the link below:</p>
                    <a href="${url}">Verify Email</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>${url}</p>
                    <p>This link will expire in 24 hours.</p>
                `
            };

            try {
                const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "accept": "application/json",
                        "content-type": "application/json",
                        "api-key": process.env.BREVO_API_KEY,
                    },
                    body: JSON.stringify(emailData)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Brevo API Error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData
                    });
                    throw new Error(`Failed to send verification email: ${response.statusText}`);
                }

                // No need to return anything as the function is expected to return void
            } catch (error) {
                console.error('Error in sendVerificationEmail:', error);
                throw new Error('Failed to send verification email. Please try again later.');
            }
        },
        autoSignInAfterVerification: true,
        sendOnSignUp: true
    }
});