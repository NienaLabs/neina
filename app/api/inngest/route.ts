import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { resumeCreated,resumeUpdated } from "@/inngest/resume";
import { tailoredResumeCreated, tailoredResumeUpdated, coverLetterGenerated } from "@/inngest/tailored";
import { interviewCreated } from "@/inngest/interview";
import  {dailyJobFeed,jsearchIngestCategory, processRecruiterJob}  from "@/inngest/jobs";


import { itemRegenerated, skillsRegenerated, outreachMessageGenerated } from "@/inngest/generators";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    resumeCreated,
    resumeUpdated,
    tailoredResumeCreated,
    dailyJobFeed,
    jsearchIngestCategory,
    processRecruiterJob,
    tailoredResumeUpdated,
    coverLetterGenerated,
    interviewCreated,
    itemRegenerated,
    skillsRegenerated,
    outreachMessageGenerated
  ],
});