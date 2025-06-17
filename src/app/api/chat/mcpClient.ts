import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const postgresUrl = process.env.MCP_POSTGRES_URL || ''

let clientInstance: McpClient | null = null

export async function getMcpClient(): Promise<McpClient> {
  if (!clientInstance) {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', postgresUrl],
    })
    const client = new McpClient({ name: 'postgres-mcp-client', version: '0.1.0' })
    await client.connect(transport)
    clientInstance = client
  }
  return clientInstance
}

export async function runQuery<T = unknown>(sql: string): Promise<T[]> {
  const client = await getMcpClient()
  const result = await client.callTool({ name: 'query', arguments: { sql } })
  const text = (result.content as Array<{ type: string; text?: string }>)
    .find(c => c.type === 'text')?.text
  return JSON.parse(text ?? '[]') as T[]
} 