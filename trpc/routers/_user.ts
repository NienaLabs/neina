import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/prisma";

export const userRouter = createTRPCRouter({
    getMe: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({
            where: { id: ctx.session.user.id },
        });
        return user;
    }),
    updateProfile: protectedProcedure
        .input(
            z.object({
                role: z.string().optional(),
                goal: z.string().optional(),
                referralSource: z.string().optional(),
                jobTitle: z.string().optional(),
                experienceLevel: z.string().optional(),
                selectedTopics: z.array(z.string()).optional(),
                location: z.string().optional(),
                jobType: z.string().optional(),
                remotePreference: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return await prisma.user.update({
                where: { id: ctx.session.user.id },
                data: {
                    ...input,
                    onboardingCompleted: true,
                },
            });
        }),
});
