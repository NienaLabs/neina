import { inngest } from "./client";
import { createNetwork, createState } from "@inngest/agent-kit";
import { regenerateItemAgent, regenerateSkillsAgent, outreachMessageAgent } from "./agents";
import { REGENERATE_ITEM_PROMPT, REGENERATE_SKILLS_PROMPT, OUTREACH_MESSAGE_PROMPT } from "@/constants/prompts-backend";

// Networks
const regenerateItemNetwork = createNetwork({
  name: "regenerate-item-network",
  agents: [regenerateItemAgent],
  defaultState: createState<{ regenerateItemAgent: string }>({ regenerateItemAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return regenerateItemAgent;
  }
});

const regenerateSkillsNetwork = createNetwork({
  name: "regenerate-skills-network",
  agents: [regenerateSkillsAgent],
  defaultState: createState<{ regenerateSkillsAgent: string }>({ regenerateSkillsAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return regenerateSkillsAgent;
  }
});

const outreachMessageNetwork = createNetwork({
  name: "outreach-message-network",
  agents: [outreachMessageAgent],
  defaultState: createState<{ outreachMessageAgent: string }>({ outreachMessageAgent: "" }),
  router: ({ callCount }) => {
    if (callCount > 0) return undefined;
    return outreachMessageAgent;
  }
});

// Workflows

export const itemRegenerated = inngest.createFunction(
  { id: "item-regeneration-workflow" },
  { event: "app/item.regenerated" },
  async ({ step, event }) => {
    try {
      const { itemType, title, subtitle, currentDescription, userInstruction } = event.data;
      
      const state = createState<{ regenerateItemAgent: string }>({ regenerateItemAgent: "" });
      
      const filledPrompt = REGENERATE_ITEM_PROMPT
        .replace("{output_language}", "English")
        .replace("{item_type}", itemType)
        .replace("{title}", title)
        .replace("{subtitle}", subtitle)
        .replace("{current_description}", Array.isArray(currentDescription) ? currentDescription.join("\n- ") : currentDescription)
        .replace("{user_instruction}", userInstruction);

      const result = await regenerateItemNetwork.run(filledPrompt, { state });
      
      const data = JSON.parse(result.state.data.regenerateItemAgent || "{}");
      
      // Notify client via SSE
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'ITEM_REGENERATED_READY',
        data: { 
            itemId: event.data.itemId,
            resumeId: event.data.resumeId,
            newBullets: data.new_bullets,
            changeSummary: data.change_summary
        }
      });

      return { success: true, data };

    } catch (error) {
      console.error("Item regeneration failed", error);
      // Notify failure
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'ITEM_REGENERATED_FAILED',
          data: { itemId: event.data.itemId, resumeId: event.data.resumeId, error: String(error) }
        });
      } catch (_) { /* best-effort */ }
      throw error;
    }
  }
);

export const skillsRegenerated = inngest.createFunction(
  { id: "skills-regeneration-workflow" },
  { event: "app/skills.regenerated" },
  async ({ step, event }) => {
    try {
      const { currentSkills, userInstruction } = event.data;
      
      const state = createState<{ regenerateSkillsAgent: string }>({ regenerateSkillsAgent: "" });
      
      const filledPrompt = REGENERATE_SKILLS_PROMPT
        .replace("{output_language}", "English")
        .replace("{current_skills}", Array.isArray(currentSkills) ? currentSkills.join(", ") : currentSkills)
        .replace("{user_instruction}", userInstruction);

      const result = await regenerateSkillsNetwork.run(filledPrompt, { state });
      
      const data = JSON.parse(result.state.data.regenerateSkillsAgent || "{}");
      
      // Notify client via SSE
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'SKILLS_REGENERATED_READY',
        data: { 
            resumeId: event.data.resumeId,
            newSkills: data.new_skills,
            changeSummary: data.change_summary
        }
      });

      return { success: true, data };

    } catch (error) {
      console.error("Skills regeneration failed", error);
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'SKILLS_REGENERATED_FAILED',
          data: { resumeId: event.data.resumeId, error: String(error) }
        });
      } catch (_) { /* best-effort */ }
      throw error;
    }
  }
);

export const outreachMessageGenerated = inngest.createFunction(
  { id: "outreach-message-generation-workflow" },
  { event: "app/outreach-message.generated" },
  async ({ step, event }) => {
    try {
      const { jobDescription, resumeData } = event.data;
      
      const state = createState<{ outreachMessageAgent: string }>({ outreachMessageAgent: "" });
      
      // Ensure resume data is a string for the prompt
      const resumeString = typeof resumeData === 'string' ? resumeData : JSON.stringify(resumeData, null, 2);

      const filledPrompt = OUTREACH_MESSAGE_PROMPT
        .replace("{output_language}", "English")
        .replace("{job_description}", jobDescription)
        .replace("{resume_data}", resumeString);

      const result = await outreachMessageNetwork.run(filledPrompt, { state });
      
      // Agent returns plain text directly
      const message = result.state.data.outreachMessageAgent;
      
      // Notify client via SSE
      const { emitUserEvent } = await import("@/lib/events");
      emitUserEvent(event.data.userId, {
        type: 'OUTREACH_MESSAGE_READY',
        data: { 
            message,
            resumeId: event.data.resumeId // Assuming this is passed in event.data
         } 
      });

      return { success: true, message };

    } catch (error) {
      console.error("Outreach message generation failed", error);
      try {
        const { emitUserEvent } = await import("@/lib/events");
        emitUserEvent(event.data.userId, {
          type: 'OUTREACH_MESSAGE_FAILED',
          data: { resumeId: event.data.resumeId, error: String(error) }
        });
      } catch (_) { /* best-effort */ }
      throw error;
    }
  }
);
