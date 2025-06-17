import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const postgresUrl = process.env.MCP_POSTGRES_URL || ''

let clientInstance: McpClient | null = null

export let currentUserId: string | undefined

/** Set the current user id for RLS enforcement */
export function setCurrentUserId(id?: string) {
  currentUserId = id
}

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

/** Rewrite any query on the students table to enforce school membership filter */
function applySchoolFilter(sql: string, userId: string): string | undefined {
  const trimmed = sql.trim().replace(/;$/, '')
  // Only rewrite if querying students
  if (/from\s+students\b/i.test(trimmed)) {
    const joinClause =
      ' JOIN school_student_link ssl ON ssl.student_id = students.student_id'
      + ' JOIN user_school_memberships usm ON usm.school_id = ssl.school_id'
    let rewritten = trimmed.replace(/from\s+students\b/i, match => `${match}${joinClause}`)
    if (/\bwhere\b/i.test(rewritten)) {
      // insert user filter at start of WHERE
      rewritten = rewritten.replace(/\bwhere\b/i, `WHERE usm.user_id = '${userId}' AND `)
    } else {
      // append WHERE clause
      rewritten = `${rewritten} WHERE usm.user_id = '${userId}'`
    }
    return rewritten + ';'
  }
  return undefined
}

export async function runQuery<T = unknown>(sql: string): Promise<T[]> {
  const client = await getMcpClient()
  // Enforce school-level access for student queries if currentUserId is set
  const filtered = currentUserId ? applySchoolFilter(sql, currentUserId) : undefined
  const finalSql = filtered ?? sql
  // Execute the SQL
  const result = await client.callTool({ name: 'query', arguments: { sql: finalSql } })
  const text = (result.content as Array<{ type: string; text?: string }>)
    .find(c => c.type === 'text')?.text
  return JSON.parse(text ?? '[]') as T[]
} 