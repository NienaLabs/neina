import { createAuthClient } from "better-auth/react";
import type { auth } from "./lib/auth";
import type { BetterAuthClientPlugin } from "better-auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth/client";


export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    // Cast to BetterAuthClientPlugin (not `any`): an `any` element widens the
    // plugins tuple to any[], which breaks inferAdditionalFields session typing.
    plugins: [inferAdditionalFields<typeof auth>(), polarClient() as BetterAuthClientPlugin],
});
export const { signIn, signOut, signUp, useSession } = authClient