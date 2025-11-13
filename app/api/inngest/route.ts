import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { resumeCreated,resumeUpdated } from "@/inngest/resume";
import { tailoredResumeCreated } from "@/inngest/tailored";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    resumeCreated,
    resumeUpdated,
    tailoredResumeCreated
    /* your functions will be passed here later! */
  ],
});