import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { resumeCreated,resumeUpdated } from "@/inngest/functions";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    resumeCreated,
    resumeUpdated
    /* your functions will be passed here later! */
  ],
});