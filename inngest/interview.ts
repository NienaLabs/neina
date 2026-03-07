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
    { id: "interview-generation-workflow", concurrency: 1 },
    { event: "app/interview.created" },
    async ({ event, step }) => {
        // Safety delay for API rate limits
        await step.sleep('rate-limit-cooldown', '10s');
        const { interviewId, role, description, type, questionCount, resumeContent } = event.data;

        // Construct the prompt input
        const promptInput = `
        Role: ${role}
        Job Description: ${description}
        Interview Type: ${type}
        Number of Questions: ${questionCount}
        ${resumeContent ? `Resume Context: ${resumeContent}` : ''}
        `;

        // Run the agent to get raw content
        const response = await questionnaireAgent.run(promptInput);
        const rawContent = lastAssistantTextMessageContent(response);

        if (!rawContent) {
            throw new Error("No content from agent");
        }

        // 2. Parse the content
        const questions = await step.run("parse-questions", async () => {
            // Extract JSON
            const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/) || [null, rawContent];
            const jsonStr = jsonMatch[1] || rawContent;

            // Use validJson helper
            const questionsData = validJson(jsonStr) || JSON.parse(jsonStr);

            if (!questionsData || !Array.isArray(questionsData.questions)) {
                throw new Error("Invalid questions format");
            }
            return questionsData.questions; // Return just the array
        });

        // 3. Save to DB
        const result = await step.run("save-questions", async () => {
            return await prisma.interview.update({
                where: { id: interviewId },
                data: {
                    questions: questions, // Prisma Json type
                    status: 'ACTIVE' // Move to ACTIVE once ready
                }
            });
        });

        // 4. Notify Client via SSE
        const { userId } = event.data;
        if (userId) {
            const { emitUserEvent } = await import("@/lib/events");
            emitUserEvent(userId, {
                type: 'INTERVIEW_READY',
                data: { interviewId }
            });
        }

        return result;
    }
);
