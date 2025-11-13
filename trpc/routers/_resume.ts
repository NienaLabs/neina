import {z} from "zod";
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
            const primaryResume = await prisma.resume.findUnique({
                where:{
                    id:input.primaryResumeId,
                    userId:ctx.session?.session.userId
                }
            })
            if(!primaryResume){
                throw new TRPCError({code:"NOT_FOUND",message:"Primary resume not found"})
            }
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
                    isPrimary:true
                },
                include:{
                    tailoredResumes:true
                }
            })
            return resumes}
            catch(e){
                console.log(e)
                throw new TRPCError({code:"NOT_FOUND",message:`error: + ${e}`})
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
            resumeId:z.string()
        })
    )
    .mutation(
        async({input,ctx})=>{
            await prisma.$transaction(async(tx)=>{
                await tx.resume.updateMany({
                    where:{
                        userId:ctx.session?.session.userId,
                        isPrimary:true
                    },
                    data:{
                        isPrimary:false
                    }
                })
                await tx.resume.update({
                    where:{
                        id:input.resumeId,
                        userId:ctx.session?.session.userId
                    },
                    data:{
                        isPrimary:true
                    }
                })
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