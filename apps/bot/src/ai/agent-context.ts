import {createMCPClient, type MCPClient} from '@ai-sdk/mcp'
import type {ToolSet} from 'ai'

export async function createAgentContextClient(agentContextConfig: {
  mcpUrl: string
  readToken: string
}): Promise<{mcpClient: MCPClient; tools: ToolSet}> {
  const mcpClient = await createMCPClient({
    transport: {
      type: 'http',
      url: agentContextConfig.mcpUrl,
      headers: {Authorization: `Bearer ${agentContextConfig.readToken}`},
    },
  })
  const tools = await mcpClient.tools()
  return {mcpClient, tools}
}
