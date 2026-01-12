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
});
