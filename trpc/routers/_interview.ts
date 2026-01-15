import { z } from "zod";
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
      const { role, description, type, questionCount, resumeId, mode } = input;
      const userId = ctx.session.user.id; // User must be authenticated

      // Check User Credits / Minutes
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { interview_minutes: true, resume_credits: true },
      });

      if (!user || user.interview_minutes <= 0) {
          // For testing, let's allow it or throw error.
          // throw new Error("Insufficient interview minutes.");
          // Keeping it permissive for now as requested "Pricing implementation deferred"
      }

      // If resume provided, fetch content (optional for context)
      let resumeContent = "";
      if (resumeId && resumeId !== 'none') {
        const resume = await prisma.resume.findUnique({
          where: { id: resumeId },
          select: { content: true },
        });
        if (resume) resumeContent = resume.content;
      }

      // Create Interview Record
      // Map input type string to Enum if needed, or Zod matches Prisma Enum
      // Prisma Enum: SCREENING, BEHAVIORAL, TECHNICAL, GENERAL, PROMPT_SCHOLARSHIP
      // We need to map friendly strings to Prisma Enums
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
          resume_id: resumeId && resumeId !== 'none' ? resumeId : undefined
        },
      });

      // Trigger Background Job
      await inngest.send({
        name: "app/interview.created",
        data: {
          interviewId: interview.id,
          role,
          description,
          type,
          questionCount,
          resumeContent,
        },
      });

      return {
        interviewId: interview.id,
        status: 'SCHEDULED'
      };
    }),

    getInterview: protectedProcedure
    .input(z.object({ interviewId: z.string() }))
    .query(async ({ ctx, input }) => {
       const interview = await prisma.interview.findUnique({
           where: { id: input.interviewId },
       });
       if (!interview) throw new Error("Interview not found");
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
         
         // 1. Get Interview Details (for context)
         const interview = await prisma.interview.findUnique({
             where: { id: interviewId },
             include: { resume: { select: { content: true } } }
         });

         if (!interview) throw new Error("Interview not found");

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
                 feedback: scoreResult ? (scoreResult as any) : undefined, // Save full result json
                 analyzedAt: new Date(),
                 end_time: new Date(),
             }
         });

         return updated;
    }),
});
