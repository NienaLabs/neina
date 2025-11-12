import { AgentResult, TextMessage } from "@inngest/agent-kit"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function lastAssistantTextMessageContent(result: AgentResult): string | undefined {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  )
  
  if (lastAssistantTextMessageIndex === -1) {
    return undefined
  }
  
  const message = result.output[lastAssistantTextMessageIndex] as TextMessage | undefined
  
  if (!message?.content) {
    return undefined
  }
  
  if (typeof message.content === "string") {
    return message.content
  }
  
  // Handle array content type
  return message.content.map((c) => c.text).join("")
}