import { createAuthClient } from "better-auth/react";
import type { auth } from "./lib/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth/client";


export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [inferAdditionalFields<typeof auth>(), polarClient() as any],
});
export const { signIn, signOut, signUp, useSession } = authClient