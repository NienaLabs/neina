import { analysisPrompt, extractionPrompt, scorePrompt } from "@/constants/prompts";
import { createAgent, openai } from "@inngest/agent-kit";
import { lastAssistantTextMessageContent } from "@/lib/utils";

function extractJson(str: string): string {
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    return match[1];
  }
  return str;
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
