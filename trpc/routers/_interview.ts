import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../init";
import { inngest } from "@/inngest/client";
import prisma from '@/lib/prisma';


export const interviewRouter = createTRPCRouter({
  createSession: protectedProcedure
    .input(
      z.object({
        role: z.string().min(1),
        description: z.string().min(1),
        type: z.enum(['screening', 'behavioral', 'technical', 'general', 'promotion']),
        questionCount: z.number().min(3).max(20).default(10),
        resumeId: z.string().optional(),
        mode: z.enum(['VOICE', 'AVATAR']).default('VOICE'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { role, description, type, questionCount, resumeId, mode } = input;
        const userId = ctx.session.user.id; // User must be authenticated

        // Check User Credits / Minutes (reserved for future enforcement)
        const _user = await prisma.user.findUnique({
          where: { id: userId },
          select: { interview_minutes: true, resume_credits: true },
        });

        // If resume provided, fetch content (optional for context)
        let resumeContent = "";
        if (resumeId && resumeId !== 'none') {
          const resume = await prisma.resume.findUnique({
            where: { id: resumeId },
            select: { content: true },
          });
          if (resume) resumeContent = resume.content;
        }

        const typeMap: Record<string, 'SCREENING' | 'BEHAVIORAL' | 'TECHNICAL' | 'GENERAL' | 'PROMPT_SCHOLARSHIP'> = {
          'screening': 'SCREENING',
          'behavioral': 'BEHAVIORAL',
          'technical': 'TECHNICAL',
          'general': 'GENERAL',
          'promotion': 'PROMPT_SCHOLARSHIP',
        };

        const interview = await prisma.interview.create({
          data: {
            user_id: userId,
            status: 'SCHEDULED', // Waiting for questions
            type: typeMap[type] || 'GENERAL',
            mode: mode,
            questionCount: questionCount,
            questions: [], // Will be populated by Inngest
            role: role,
            description: description,
            resume_id: (resumeId && resumeId !== 'none' && resumeId !== 'null' && resumeId !== 'undefined') ? resumeId : undefined
          },
        });


        // Trigger Background Job (fire-and-forget — do not block session creation)
        // If Inngest is not configured (missing INNGEST_EVENT_KEY), the interview
        // record is still created and the user is not blocked.
        let questionsReady = false;
        inngest.send({
          name: "app/interview.created",
          data: {
            interviewId: interview.id,
            userId,
            role,
            description,
            type,
            questionCount,
            resumeContent,
          },
        }).then(() => {
          console.log(`✅ [Interview] Inngest event sent for ${interview.id}`);
        }).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(
            `⚠️ [Interview] Inngest event failed (interview still created): ${message}. ` +
            `Make sure INNGEST_EVENT_KEY is set in .env, or run the Inngest Dev Server locally.`
          );
        });

        return {
          interviewId: interview.id,
          status: 'SCHEDULED',
          questionsReady,
        };
      } catch (error) {
        console.error("❌ [Interview] createSession failed:", error);
        throw error; // Let TRPC handle it, but we'll see it in logs
      }
    }),

  getInterview: protectedProcedure
    .input(z.object({ interviewId: z.string() }))
    .query(async ({ ctx, input }) => {
      const interview = await prisma.interview.findFirst({
        where: {
          id: input.interviewId,
          user_id: ctx.session.user.id
        },
      });
      if (!interview) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Interview not found or unauthorized',
        });
      }
      return interview;
    }),
  endSession: protectedProcedure
    .input(z.object({
      interviewId: z.string(),
      durationSeconds: z.number(),
      transcript: z.array(z.object({ role: z.string(), content: z.string() })).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { interviewId, durationSeconds, transcript } = input;

      // 1. Get Interview Details (for context) and verify ownership
      const interview = await prisma.interview.findFirst({
        where: {
          id: interviewId,
          user_id: ctx.session.user.id
        },
        include: { resume: { select: { content: true } } }
      });

      if (!interview) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Interview not found or unauthorized',
        });
      }

      // 2. Generate Score (Synchronous for now)
      let scoreResult = null;
      try {
        // Only generate score if transcript is not empty, otherwise we get 1
        if (transcript.length > 0) {
          const { generateInterviewScore } = await import("@/lib/ai-scoring");
          scoreResult = await generateInterviewScore(
            transcript,
            interview.role || 'Candidate',
            interview.description || undefined,
            interview.resume?.content || undefined
          );
        }
      } catch (err) {
        console.error("Failed to generate score:", err);
      }

      // 3. Update DB
      const updated = await prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: 'ANALYZED', // Mark as analyzed
          duration_seconds: durationSeconds,
          transcript: transcript, // Save raw transcript
          analysisScore: scoreResult?.score || 0,
          analysisFeedback: scoreResult ? `
${scoreResult.feedback}

### Key Strengths
${scoreResult.strengths?.map((s: string) => `- ${s}`).join('\n')}

### Areas for Improvement
${scoreResult.weaknesses?.map((w: string) => `- ${w}`).join('\n')}
          `.trim() : undefined,
          feedback: scoreResult ? (scoreResult as any) : undefined, // Save full result json
          analyzedAt: new Date(),
          end_time: new Date(),
        }
      });

      return updated;
    }),
});
