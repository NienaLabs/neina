import {z} from "zod";
import { jsonToMarkdown } from "@/lib/converter";
import { ResumeExtraction } from "@/components/resume/editor/types";
import { createTRPCRouter, protectedProcedure } from "../init";
import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const resumeRouter = createTRPCRouter({
    create: protectedProcedure
    .input(
        z.object({
            content:z.string(),
            name:z.string()
        })
    )
    .mutation(
        async({input,ctx})=>{
            try{
         const user = await prisma.user.findUnique({
            where: { id: ctx.session?.session.userId },
            select: { resume_credits: true }
         });

         if (!user || user.resume_credits <= 0) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient credits. Please upgrade your plan or purchase credits."
            });
         }

         await prisma.user.update({
             where: { id: ctx.session?.session.userId },
             data: { resume_credits: { decrement: 1 } }
         });

         await inngest.send({
           name:"app/primary-resume.created", 
           data:{
            ...input,
            userId:ctx.session?.session.userId
           }
        })}catch(e){
            throw new TRPCError({code:"INTERNAL_SERVER_ERROR",message:`An unexpected error occured why trying to access Resume AI: +${e}`})
        }
        }
    ),
    update: protectedProcedure
    .input(
        z.object({
            resumeId:z.string(),
            content:z.string(),
            role:z.string(),
            description:z.string(),
            name:z.string()
        })
    )
    .mutation(
        async({input,ctx})=>{
         await inngest.send({
           name:"app/resume.updated", 
           data:{
            ...input,
            userId:ctx.session?.session.userId
        }
        })
        }
    ),
    createTailored: protectedProcedure
    .input(
        z.object({
            primaryResumeId:z.string(),
            role:z.string(),
            description:z.string(),
            name:z.string()
        })
    )
    .mutation(
        async({input,ctx})=>{
            const user = await prisma.user.findUnique({
                where: { id: ctx.session?.session.userId },
                select: { resume_credits: true }
            });

            if (!user || user.resume_credits <= 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Insufficient credits. Please upgrade your plan or purchase credits."
                });
            }

            const primaryResume = await prisma.resume.findUnique({
                where:{
                    id:input.primaryResumeId,
                    userId:ctx.session?.session.userId
                }
            })
            if(!primaryResume){
                throw new TRPCError({code:"NOT_FOUND",message:"Primary resume not found"})
            }

            await prisma.user.update({
                where: { id: ctx.session?.session.userId },
                data: { resume_credits: { decrement: 1 } }
            });

         await inngest.send({
           name:"app/tailored-resume.created", 
           data:{
            content:primaryResume.content,
            role:input.role,
            description:input.description,
            name:input.name,
            resumeId:input.primaryResumeId,
            userId:ctx.session?.session.userId
           }
        })
        }
    ),
    getPrimaryResumes: protectedProcedure
    .query(
        async({ctx})=>{
            try{
            const resumes = await prisma.resume.findMany({
                where:{
                    userId:ctx.session?.session.userId,
                    // Fetch all resumes
                },
                include:{
                    tailoredResumes:true
                },
                orderBy: {
                    isPrimary: 'desc'
                }
            })
            return resumes}
            catch{
                throw new TRPCError({code:"NOT_FOUND",message:`error: + ${"unknown error"}`})
            }
        }
    ),
    getTailoredResumes: protectedProcedure
    .query(
        async({ctx})=>{
            const resumes = await prisma.tailoredResume.findMany({
                where:{
                    userId:ctx.session?.session.userId,
                }
            })
            return resumes
        }
    ),
    setPrimary: protectedProcedure
    .input(
        z.object({
            resumeId:z.string(),
            isTailored: z.boolean().optional().default(false)
        })
    )
    .mutation(
        async({input,ctx})=>{
            await prisma.$transaction(async(tx)=>{
                // Unset current primary
                await tx.resume.updateMany({
                    where:{
                        userId:ctx.session?.session.userId,
                        isPrimary:true
                    },
                    data:{
                        isPrimary:false
                    }
                })

                if (input.isTailored) {
                    const tailored = await tx.tailoredResume.findUnique({
                        where: { id: input.resumeId, userId: ctx.session?.session.userId }
                    });
                    
                    if (!tailored) {
                        throw new TRPCError({ code: "NOT_FOUND", message: "Tailored resume not found" });
                    }

                    await tx.resume.create({
                        data: {
                            userId: ctx.session?.session.userId,
                            name: `${tailored.name} (Promoted)`,
                            content: tailored.content,
                            isPrimary: true,
                            extractedData: tailored.extractedData || undefined,
                            analysisData: tailored.analysisData || undefined,
                            scoreData: tailored.scores || undefined,
                        }
                    });
                } else {
                    // Set existing primary resume
                    await tx.resume.update({
                        where:{
                            id:input.resumeId,
                            userId:ctx.session?.session.userId
                        },
                        data:{
                            isPrimary:true
                        }
                    })
                }
            })
        }
    ),
    getUnique: protectedProcedure
    .input(
        z.object({
            resumeId:z.string()
        })
    )
    .query(
        async({input,ctx})=>{
         try{
            const resume = await prisma.resume.findUnique({
                where:{
                    id:input.resumeId,
                    userId:ctx.session?.session.userId
                }
            })
            if(resume) return resume

            const tailoredResume = await prisma.tailoredResume.findUnique({
                where:{
                    id:input.resumeId,
                    userId:ctx.session?.session.userId
                }
            })
            return tailoredResume
        }
         catch(e){
            throw new TRPCError({code:"NOT_FOUND",message:"The requested resource was not found"})
         }
       }  
    ),
    saveData: protectedProcedure
    .input(
        z.object({
            resumeId: z.string(),
            extractedData: z.any(),
            isTailored: z.boolean()
        })
    )
    .mutation(
        async({input, ctx}) => {
            const { resumeId, extractedData, isTailored } = input;
            
            if (isTailored) {
                await prisma.tailoredResume.update({
                    where: {
                        id: resumeId,
                        userId: ctx.session?.session.userId
                    },
                    data: {
                        extractedData
                    }
                });
            } else {
                await prisma.resume.update({
                    where: {
                        id: resumeId,
                        userId: ctx.session?.session.userId
                    },
                    data: {
                        extractedData
                    }
                });
            }
        }
    ),
    reanalyze: protectedProcedure
    .input(
        z.object({
            resumeId: z.string(),
            isTailored: z.boolean()
        })
    )
    .mutation(
        async({input, ctx}) => {
            const { resumeId, isTailored } = input;

            const user = await prisma.user.findUnique({
                where: { id: ctx.session?.session.userId },
                select: { resume_credits: true }
            });

            if (!user || user.resume_credits <= 0) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Insufficient credits. Please upgrade your plan or purchase credits."
                });
            }
            
            if (isTailored) {
                const tailoredResume = await prisma.tailoredResume.findUnique({
                    where: {
                        id: resumeId,
                        userId: ctx.session?.session.userId
                    }
                });

                if (!tailoredResume) {
                    throw new TRPCError({code: "NOT_FOUND", message: "Tailored resume not found"});
                }

                // Convert extractedData to markdown if available
                let content = tailoredResume.content;
                if (tailoredResume.extractedData) {
                    try {
                        const extractedData = (typeof tailoredResume.extractedData === 'string' 
                            ? JSON.parse(tailoredResume.extractedData) 
                            : tailoredResume.extractedData) as ResumeExtraction;
                        content = jsonToMarkdown(extractedData);
                    } catch (e) {
                        console.error("Failed to convert extractedData to markdown", e);
                    }
                }

                await prisma.user.update({
                    where: { id: ctx.session?.session.userId },
                    data: { resume_credits: { decrement: 1 } }
                });

                await inngest.send({
                    name: "app/tailored-resume.updated",
                    data: {
                        resumeId: tailoredResume.id,
                        userId: ctx.session?.session.userId,
                        content: content,
                        role: tailoredResume.role || "General",
                        description: tailoredResume.jobDescription || "",
                        name: tailoredResume.name,
                        primaryResumeId: tailoredResume.primaryResumeId
                    }
                });
            } else {
                const resume = await prisma.resume.findUnique({
                    where: {
                        id: resumeId,
                        userId: ctx.session?.session.userId
                    }
                });

                if (!resume) {
                    throw new TRPCError({code: "NOT_FOUND", message: "Resume not found"});
                }

                // Convert extractedData to markdown if available
                let content = resume.content;
                if (resume.extractedData) {
                    try {
                        const extractedData = (typeof resume.extractedData === 'string' 
                            ? JSON.parse(resume.extractedData) 
                            : resume.extractedData) as ResumeExtraction;
                        content = jsonToMarkdown(extractedData);
                    } catch (e) {
                        console.error("Failed to convert extractedData to markdown", e);
                    }
                }

                await prisma.user.update({
                    where: { id: ctx.session?.session.userId },
                    data: { resume_credits: { decrement: 1 } }
                });

                await inngest.send({
                    name: "app/resume.updated",
                    data: {
                        resumeId: resume.id,
                        userId: ctx.session?.session.userId,
                        content: content,
                        role: "General",
                        description: "",
                        name: resume.name
                    }
                });
            }
        }
    ),
    delete: protectedProcedure
    .input(
        z.object({
            resumeId:z.string()
        })
    )
    .mutation(
        async({input,ctx})=>{
            await prisma.resume.delete({
                where:{
                    id:input.resumeId,
                    userId:ctx.session?.session.userId
                }
            })
        }
    )
})