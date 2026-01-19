import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { resumeCreated,resumeUpdated } from "@/inngest/resume";
import { tailoredResumeCreated,tailoredResumeUpdated } from "@/inngest/tailored";
import { interviewCreated } from "@/inngest/interview";
import  {dailyJobFeed,jsearchIngestCategory,scheduledIngestProcessor, processRecruiterJob}  from "@/inngest/jobs";


export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    resumeCreated,
    resumeUpdated,
    tailoredResumeCreated,
    dailyJobFeed,
    jsearchIngestCategory,
    scheduledIngestProcessor,
    processRecruiterJob,
    tailoredResumeUpdated,
    interviewCreated
    /* your functions will be passed here later! */
  ],
});