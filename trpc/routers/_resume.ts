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
            role:z.string(),
            description:z.string(),
            isPrimary:z.boolean(),
            name:z.string()
        })
    )
    .mutation(
        async({input,ctx})=>{
         await inngest.send({
           name:"app/resume.created", 
           data:{
            ...input,
            userId:ctx.session?.session.userId
           }
        })
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
           name:"app/resume.created", 
           data:{
            content:primaryResume.content,
            role:input.role,
            description:input.description,
            isPrimary:false,
            name:input.name,
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
            const resumes = await prisma.resume.findMany({
                where:{
                    userId:ctx.session?.session.userId,
                    isPrimary:false
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
         try{const resume = await prisma.resume.findUnique({
            where:{
                id:input.resumeId,
                userId:ctx.session?.session.userId
            }
      
         })
        return resume
        }
         catch(e){
            throw new TRPCError({code:"NOT_FOUND",message:"The requested resource was not found"})
         }
       }  
    )
})