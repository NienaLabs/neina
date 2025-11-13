import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { parserAgent, analysisAgent, scoreAgent } from "./agents";

interface AgentState {
  parserAgent:string;
  analyserAgent:string;
  scoreAgent:string;
}

const pipeline = [parserAgent, analysisAgent, scoreAgent];


const state = createState<AgentState>({
  parserAgent:"",
  analyserAgent:"",
  scoreAgent:""
})

const network = createNetwork({
  name:'resume-processing-network',
  defaultState:state,
  agents: pipeline,
  router: ({ callCount }) => {
    // Route strictly based on sequence
    const nextAgent = pipeline[callCount];
    return nextAgent ?? undefined; // Stop when done
  },
});

export const resumeCreated = inngest.createFunction(
  { id: "resume-AI-workflow" },
  { event: "app/primary-resume.created" },
  async ({step,event}) => {
    const state = createState<AgentState>({
      parserAgent:"",
      analyserAgent:"",
      scoreAgent:""
    })
    const resumeText =`
    #Resume
    ${event.data.content}
    `
    // Run through the network (parser → analysis → score)
    const result = await network.run(resumeText,{state});
    await step.run("save-resume",async()=>{
    await prisma.resume.create({
      data:{
      name:event.data.name,
      content:event.data.content,
      isPrimary:true,
      userId:event.data.userId,
      extractedData:result.state.data.parserAgent,
      analysisData:result.state.data.analyserAgent,
      scoreData:result.state.data.scoreAgent}
    })
    })

    return result // Final stage (scoreAgent) output
  }
);

export const resumeUpdated = inngest.createFunction(
  { id: "resume-updated-workflow" },
  { event: "app/resume.updated" },
  async ({step,event}) => {
    const resumeText =`
    #Resume
    ${event.data.content}
    
    #Targetted Role
    ${event.data.role}
    #Job Description
    ${event.data.description}
    `
    // Run through the network (parser → analysis → score)
    const result = await network.run(resumeText,{state});
    await step.run("update-resume",async()=>{
    await prisma.resume.update({
      where:{
        id:event.data.resumeId,
        userId:event.data.userId
      },
      data:{
      name:event.data.name,
      content:event.data.content,
      extractedData:result.state.data.parserAgent,
      analysisData:result.state.data.analyserAgent,
      scoreData:result.state.data.scoreAgent}
    })
    })

    return result // Final stage (scoreAgent) output
  }
);
