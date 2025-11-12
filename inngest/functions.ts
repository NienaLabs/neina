import { analysisPrompt, extractionPrompt, scorePrompt } from "@/constants/prompts";
import { inngest } from "./client";
import { createAgent, createNetwork, createState, openai } from "@inngest/agent-kit";
import prisma from "@/lib/prisma";
import { lastAssistantTextMessageContent } from "@/lib/utils";

interface AgentState {
  parserAgent:string;
  analyserAgent:string;
  scoreAgent:string;
}

const parserAgent = createAgent({
  name: "parser-agent",
  system: extractionPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
  lifecycle:{
    onResponse:async({result,network})=>{
    const assistantMessage = lastAssistantTextMessageContent(result)
    if(assistantMessage && network){
      network.state.data.parserAgent = JSON.parse(assistantMessage)
        }
    return result
    },
  }
});

const analysisAgent = createAgent({
  name: "analysis-agent",
  system: analysisPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
  lifecycle:{
    onResponse:async({result,network})=>{
    const assistantMessage = lastAssistantTextMessageContent(result)
    if(assistantMessage && network){
      network.state.data.analyserAgent = JSON.parse(assistantMessage)
        }
    return result
    },
  }

});

const scoreAgent = createAgent({
  name: "score-agent",
  system: scorePrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
  lifecycle:{
    onResponse:async({result,network})=>{
    const assistantMessage = lastAssistantTextMessageContent(result)
    if(assistantMessage && network){
      network.state.data.scoreAgent = JSON.parse(assistantMessage)
    }
    return result
    },
  }

});

// 2️⃣ Define a clean pipeline sequence
const pipeline = [parserAgent, analysisAgent, scoreAgent];

const state = createState<AgentState>({
  parserAgent:"",
  analyserAgent:"",
  scoreAgent:""
})

// 3️⃣ Create the network with static routing logic
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

// 4️⃣ Example Inngest function
export const resumeCreated = inngest.createFunction(
  { id: "resume-AI-workflow" },
  { event: "app/resume.created" },
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
    await step.run("save-resume",async()=>{
    await prisma.resume.create({
      data:{
      name:event.data.name,
      content:event.data.content,
      isPrimary:event.data.isPrimary,
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
