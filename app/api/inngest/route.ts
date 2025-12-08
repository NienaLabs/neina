import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { resumeCreated,resumeUpdated } from "@/inngest/resume";
import { tailoredResumeCreated,tailoredResumeUpdated } from "@/inngest/tailored";
import  {dailyJobFeed,jsearchIngestCategory,scheduledIngestProcessor}  from "@/inngest/jobs";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    resumeCreated,
    resumeUpdated,
    tailoredResumeCreated,
    dailyJobFeed,
    jsearchIngestCategory,
    scheduledIngestProcessor,
    tailoredResumeUpdated
    /* your functions will be passed here later! */
  ],
});