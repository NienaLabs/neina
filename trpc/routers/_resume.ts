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
         
         // Create the resume immediately with PENDING status
         const resume = await prisma.resume.create({
            data: {
                userId: ctx.session?.session.userId,
                name: input.name,
                content: input.content,
                status: "PENDING"
            }
         });

         await inngest.send({
           name:"app/primary-resume.created", 
           data:{
            ...input,
            userId:ctx.session?.session.userId,
            resumeId: resume.id // Pass the ID
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
         // Fetch existing resume to get previous analysis data
         const existingResume = await prisma.resume.findUnique({
             where: {
                 id: input.resumeId,
                 userId: ctx.session?.session.userId
             },
             select: { analysisData: true }
         });

         // Update status to PENDING
         await prisma.resume.update({
             where: {
                 id: input.resumeId,
                 userId: ctx.session?.session.userId
             },
             data: {
                 status: "PENDING",
                 content: input.content, // Update content as well
                 name: input.name
             }
         });

         await inngest.send({
           name:"app/resume.updated", 
           data:{
            ...input,
            userId:ctx.session?.session.userId,
            previousAnalysis: existingResume?.analysisData
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

            // Create tailored resume immediately with PENDING status
            const tailoredResume = await prisma.tailoredResume.create({
                data: {
                    userId: ctx.session?.session.userId,
                    primaryResumeId: input.primaryResumeId,
                    name: input.name,
                    role: input.role,
                    jobDescription: input.description,
                    content: primaryResume.content, // Start with primary content
                    status: "PENDING"
                }
            });

         await inngest.send({
           name:"app/tailored-resume.created", 
           data:{
            content:primaryResume.content,
            role:input.role,
            description:input.description,
            name:input.name,
            primaryResumeId:input.primaryResumeId,
            userId:ctx.session?.session.userId,
            resumeId: tailoredResume.id // Pass the new ID
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
                    createdAt: 'desc' // Order by newest first
                }
            })
            return resumes}
            catch(err){
                console.error("Error fetching resumes:", err);
                // Throw the actual error so we can debug it on the client
                throw new TRPCError({
                    code:"INTERNAL_SERVER_ERROR",
                    message: err instanceof Error ? err.message : "Failed to fetch resumes"
                })
            }
        }
    ),
    getTailoredResumes: protectedProcedure
    .query(
        async({ctx})=>{
            const resumes = await prisma.tailoredResume.findMany({
                where:{
                    userId:ctx.session?.session.userId,
                },
                orderBy: {
                    createdAt: 'desc'
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
                            status: "COMPLETED" // Promoted one is already ready
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

                // Update status to PENDING
                await prisma.tailoredResume.update({
                    where: { id: resumeId },
                    data: { status: "PENDING" }
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
                        primaryResumeId: tailoredResume.primaryResumeId,
                        previousAnalysis: tailoredResume.analysisData
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

                // Update status to PENDING
                await prisma.resume.update({
                    where: { id: resumeId },
                    data: { status: "PENDING" }
                });

                await inngest.send({
                    name: "app/resume.updated",
                    data: {
                        resumeId: resume.id,
                        userId: ctx.session?.session.userId,
                        content: content,
                        role: "General",
                        description: "",
                        name: resume.name,
                        previousAnalysis: resume.analysisData
                    }
                });
            }
        }
    ),
    delete: protectedProcedure
    .input(
        z.object({
            resumeId:z.string(),
            isTailored: z.boolean().optional()
        })
    )
    .mutation(
        async({input,ctx})=>{
            if(input.isTailored){
                await prisma.tailoredResume.delete({
                    where:{
                        id:input.resumeId,
                        userId:ctx.session?.session.userId
                    }
                })
            } else {
                await prisma.resume.delete({
                    where:{
                        id:input.resumeId,
                        userId:ctx.session?.session.userId
                    }
                })
            }
        }
    )
})