/**
 * Tag Insights agent
 * ------------------
 * Owns qualitative exploration: discovering which tags, categories, and sample values align with a
 * counselor’s question. It also supports lightweight student lookups tied to those tags by
 * chaining into the tagged-students RPC.
 *
 * Design notes:
 * - Instructions bias toward calling `tag_insights` early, keeping the agent grounded in actual
 *   metadata rather than fabricated descriptors.
 * - When counselors pivot to “who” style questions, the agent calls `findTaggedStudents` to return
 *   profile links, ensuring qualitative insights can quickly become actionable cohorts.
 * - `stopWhen` is only six steps, encouraging a single clarifying question followed by tool usage
 *   and a concise synthesized answer.
 */
import { ToolLoopAgent, stepCountIs } from 'ai';
import { BASE_AGENT_RULES } from './baseInstructions';
import type { AgentFactoryParams } from './studentLookupAgent';
import { createTagInsightsTool } from '../tools/tagInsightsTool';
import { createFindTaggedStudentsTool } from '../tools/findTaggedStudentsTool';
import { createGetCurrentDateTool } from '../tools/getCurrentDateTool';

export function createTagInsightsAgent({ model, context }: AgentFactoryParams) {
  return new ToolLoopAgent({
    id: 'tag_insights',
    model,
    instructions: [
      BASE_AGENT_RULES,
      'Primary objective: surface the qualitative tags (and optional value samples) implied by the counselor request.',
      [
        'Workflow:',
        '1. Ask a concise clarifying question when the qualitative focus is ambiguous.',
        '2. Call tag_insights at least once to gather ranked tag descriptors and metadata. Provide a short search hint if the counselor highlights a specific theme.',
  '3. When the counselor asks for specific students (phrases like "which students" or "who"), call findTaggedStudents with the relevant tag_id and value from tag_insights to return names with profile links.',
        '4. Use the tag category metadata (e.g., Goals, Academics) to prioritize which descriptors to highlight.',
        '5. Reference usage counts, student coverage, and notable values from the metadata when summarizing findings.',
      ].join('\n'),
      'Keep the final response concise, actionable, and grounded in the retrieved metadata. Present student matches as Markdown links (e.g., [Student Name](/students/uuid)) and include grade level when available.',
    ].join('\n\n'),
    stopWhen: stepCountIs(6),
    tools: {
      tag_insights: createTagInsightsTool(context),
      findTaggedStudents: createFindTaggedStudentsTool(context),
      get_current_date: createGetCurrentDateTool(),
    },
  });
}
