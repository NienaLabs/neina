import { createAuthClient } from "better-auth/react";
import type { auth } from "./lib/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    plugins: [inferAdditionalFields<typeof auth>()],
});
export const {signIn,signOut,signUp,useSession}=authClient