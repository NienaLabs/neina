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

export const tailoredResumeCreated = inngest.createFunction(
  { id: "tailored-resume-AI-workflow" },
  { event: "app/tailored-resume.created" },
  async ({step,event}) => {
    const state = createState<AgentState>({
      parserAgent:"",
      analyserAgent:"",
      scoreAgent:""
    })
    const resumeText =`
    #Resume
    ${event.data.content}
    
    #Targetted Role
    ${event.data.role}
    #Job Description
    ${event.data.description}
    `
    const result = await network.run(resumeText,{state});
    await step.run("save-tailored-resume",async()=>{
    await prisma.tailoredResume.create({
      data:{
      name:event.data.name,
      content:event.data.content,
      role:event.data.role,
      jobDescription:event.data.description,
      primaryResumeId:event.data.resumeId,
      userId:event.data.userId,
      extractedData:result.state.data.parserAgent,
      analysisData:result.state.data.analyserAgent,
      scoreData:result.state.data.scoreAgent}
    })
    })

    return result 
  }
);
