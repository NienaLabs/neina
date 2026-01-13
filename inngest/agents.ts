import { analysisPrompt, extractionPrompt, scorePrompt, skillsExtractorPrompt, experienceExtractorPrompt, jobExtractionPrompt, autofixPrompt } from "@/constants/prompts";
import { createAgent, openai } from "@inngest/agent-kit";
import { lastAssistantTextMessageContent, validJson } from "@/lib/utils";



function extractJson(str: string): string {
  let jsonStr = str;
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    jsonStr = match[1];
  }
  
  // Attempt to parse/repair
  const parsed = validJson(jsonStr);
  return parsed ? JSON.stringify(parsed) : "{}";
}

export const parserAgent = createAgent({
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
      network.state.data.parserAgent = extractJson(assistantMessage)
        }
    return result
    },
  }
});

export const analysisAgent = createAgent({
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
      network.state.data.analyserAgent = assistantMessage
        }
    return result
    },
  }

});

export const scoreAgent = createAgent({
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
      network.state.data.scoreAgent = assistantMessage
    }
    return result
    },
  }

});

export const autofixAgent = createAgent({
  name: "autofix-agent",
  system: autofixPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
  lifecycle:{
    onResponse:async({result,network})=>{
    const assistantMessage = lastAssistantTextMessageContent(result)
    if(assistantMessage && network){
      network.state.data.autofixAgent = extractJson(assistantMessage)
    }
    return result
    },
  }

});

// Skills & Certifications extractor agent
export const skillsExtractorAgent = createAgent({
  name: "skills-extractor-agent",
  system: skillsExtractorPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.skillsExtractorAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

// Experience extractor agent
export const experienceExtractorAgent = createAgent({
  name: "experience-extractor-agent",
  system: experienceExtractorPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.experienceExtractorAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const jobExtractorAgent = createAgent({
  name: "job-extractor-agent",
  system: jobExtractionPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.jobExtractorAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

