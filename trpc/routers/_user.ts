
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/prisma";

export const userRouter = createTRPCRouter({
    getMe: protectedProcedure.query(async ({ ctx }) => {
        const user = await prisma.user.findUnique({
            where: { id: ctx.session.user.id },
        });
        return user;
    }),
});
