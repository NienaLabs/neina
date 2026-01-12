import { inngest } from "./client";
import { createAgent, openai } from "@inngest/agent-kit";
import { interviewQuestionPrompt } from "@/constants/prompts";
import { lastAssistantTextMessageContent, validJson } from "@/lib/utils"; // Assuming these exist
import prisma from "@/lib/prisma";

// Define the agent
export const questionnaireAgent = createAgent({
  name: "questionnaire-agent",
  system: interviewQuestionPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL || 'gpt-4o', // Fallback or use env
    baseUrl: process.env.OPENAI_BASE_URL,
  }),
});

// Define the Inngest function
export const interviewCreated = inngest.createFunction(
    { id: "interview-generation-workflow" },
    { event: "app/interview.created" },
    async ({ event, step }) => {
        console.log("🚀 Interview generation started:", event.data.interviewId);
        const { interviewId, role, description, type, questionCount, resumeContent } = event.data;

        // Construct the prompt input
        const promptInput = `
        Role: ${role}
        Job Description: ${description}
        Interview Type: ${type}
        Number of Questions: ${questionCount}
        ${resumeContent ? `Resume Context: ${resumeContent}` : ''}
        `;

        // Run the agent
        // 1. Run the agent to get raw content
        // 1. Run the agent to get raw content
        console.log("🤖 calling questionnaire agent...");
        const response = await questionnaireAgent.run(promptInput);
        console.log("✅ agent response received");
        const rawContent = lastAssistantTextMessageContent(response);
        
        if (!rawContent) {
            console.error("❌ Agent returned no content");
            throw new Error("No content from agent");
        }

        // 2. Parse the content
        const questions = await step.run("parse-questions", async () => {
             console.log("📝 Parsing agent content...");
             // Extract JSON
             const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/) || [null, rawContent];
             const jsonStr = jsonMatch[1] || rawContent;
             
             // Use validJson helper
             const questionsData = validJson(jsonStr) || JSON.parse(jsonStr);
             console.log("✅ Parsed questions data:", questionsData);
             
             if (!questionsData || !Array.isArray(questionsData.questions)) {
                 console.error("❌ Invalid questions format", questionsData);
                 throw new Error("Invalid questions format");
             }
             return questionsData.questions; // Return just the array
        });

        // 3. Save to DB
        const result = await step.run("save-questions", async () => {
            console.log("💾 Saving questions to DB for ID:", interviewId);
            return await prisma.interview.update({
                where: { id: interviewId },
                data: {
                    questions: questions, // Prisma Json type
                    status: 'SCHEDULED' // Confirm status is set
                }
            });
        });

        return result;
    }
);
