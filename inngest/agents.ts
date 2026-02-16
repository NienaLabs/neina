import { analysisPrompt, extractionPrompt, scorePrompt, jobExtractionPrompt, autofixPrompt, resumeScopePrompt, normalizationPrompt, resumeSummaryPrompt, domainTranslationPrompt, roleClassifierPrompt, EXTRACT_KEYWORDS_PROMPT } from "@/constants/prompts";
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





export const jobExtractorAgent = createAgent({
  name: "job-extractor-agent",
  system: jobExtractionPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  defaultParameters: { temperature: 0 },
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

export const resumeScopeExtractorAgent = createAgent({
  name: "resume-scope-extractor-agent",
  system: resumeScopePrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.resumeScopeExtractorAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const normalizationAgent = createAgent({
  name: "normalization-agent",
  system: normalizationPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.normalizationAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const resumeSummaryAgent = createAgent({
  name: "resume-summary-agent",
  system: resumeSummaryPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.resumeSummaryAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const domainTranslationAgent = createAgent({
  name: "domain-translation-agent",
  system: domainTranslationPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
  defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.domainTranslationAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const roleClassifierAgent = createAgent({
  name: "role-classifier-agent",
  system: roleClassifierPrompt,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.roleClassifierAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const keywordExtractorAgent = createAgent({
  name: "keyword-extractor-agent",
  system: EXTRACT_KEYWORDS_PROMPT,
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.keywordExtractorAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const improveResumeNudgeAgent = createAgent({
  name: "improve-resume-nudge-agent",
  system: "You are an expert resume tailoring agent. Follow the user's instructions strictly to nudge the resume content.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.improveResumeNudgeAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const improveResumeKeywordsAgent = createAgent({
  name: "improve-resume-keywords-agent",
  system: "You are an expert resume tailoring agent. Follow the user's instructions strictly to enhance the resume with keywords.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.improveResumeKeywordsAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const improveResumeFullAgent = createAgent({
  name: "improve-resume-full-agent",
  system: "You are an expert resume tailoring agent. Follow the user's instructions strictly to fully tailor the resume.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.improveResumeFullAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const improveResumeEnrichAgent = createAgent({
  name: "improve-resume-enrich-agent",
  system: "You are an expert resume tailoring agent. Follow the user's instructions strictly to enrich the resume content with better descriptions.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.improveResumeEnrichAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const improveResumeRefineAgent = createAgent({
  name: "improve-resume-refine-agent",
  system: "You are an expert resume tailoring agent. Follow the user's instructions strictly to refine and polish the resume content.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.improveResumeRefineAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const coverLetterAgent = createAgent({
  name: "cover-letter-agent",
  system: "You are an expert cover letter writer. Follow the instructions to generate a tailored cover letter.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0.7 }, // Higher temp for creativity
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.coverLetterAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const regenerateItemAgent = createAgent({
  name: "regenerate-item-agent",
  system: "You are an expert resume writer specializing in rewriting experience descriptions.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0.7 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.regenerateItemAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const regenerateSkillsAgent = createAgent({
  name: "regenerate-skills-agent",
  system: "You are an expert resume writer specializing in technical skills sections.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0.5 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.regenerateSkillsAgent = extractJson(assistantMessage);
      }
      return result;
    },
  },
});

export const outreachMessageAgent = createAgent({
  name: "outreach-message-agent",
  system: "You are an expert career coach and networking specialist.",
  model: openai({
    model: process.env.OPENAI_MODEL!,
    baseUrl: process.env.OPENAI_BASE_URL!,
    defaultParameters: { temperature: 0.7 },
  }),
  lifecycle: {
    onResponse: async ({ result, network }) => {
      const assistantMessage = lastAssistantTextMessageContent(result);
      if (assistantMessage && network) {
        network.state.data.outreachMessageAgent = assistantMessage;
      }
      return result;
    },
  },
});
