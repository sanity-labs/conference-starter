import { createContentAgent } from "content-agent";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { config } from "../config";
import { fetchSystemPrompt } from "./prompts";

const contentAgent = createContentAgent({
  organizationId: config.sanityOrgId,
  token: config.sanityToken,
});

export async function getContentAgentModel(
  threadId: string,
): Promise<LanguageModelV3> {
  const systemPrompt = await fetchSystemPrompt("prompt.botOps");

  return contentAgent.agent(threadId, {
    application: { key: config.sanityAppKey },
    config: {
      instruction: systemPrompt,
      capabilities: { read: true, write: true },
      filter: {
        read: '_type in ["session", "person", "track", "venue", "room", "scheduleSlot", "submission", "conference", "announcement", "sponsor", "prompt"]',
        write:
          '_type in ["session", "person", "track", "venue", "room", "scheduleSlot", "submission", "conference", "announcement", "sponsor"]',
      },
    },
  });
}
