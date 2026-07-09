import { Inngest } from "inngest";

/**
 * Inngest client instance.
 * Configured to use the local Inngest Dev Server when INNGEST_DEV=1 is set.
 * In production, set INNGEST_EVENT_KEY to your Inngest Cloud event key.
 */
export const inngest = new Inngest({
    id: "niena-app",
    eventKey: process.env.INNGEST_EVENT_KEY || "local",
    isDev: process.env.INNGEST_DEV === "1" || process.env.NODE_ENV === "development",
});