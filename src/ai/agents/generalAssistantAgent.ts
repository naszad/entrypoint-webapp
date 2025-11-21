/**
 * General Assistant agent
 * -----------------------
 * This lightweight agent is the routing fallback for counselor conversations. It owns only
 * high-level product guidance and a single academic-term lookup tool. The agent intentionally
 * avoids deep analytics work—its job is to triage ambiguous questions, provide friendly context,
 * and redirect the counselor toward the specialist agents when a request becomes data-heavy.
 *
 * Implementation highlights:
 * - The instruction block sets expectations about scope (“broad usage questions”) so routing logic
 *   can safely send uncertain conversations here without risking risky SQL execution.
 * - We wire in `get_academic_terms` directly because counselors frequently ask term/date
 *   conversions even when their broader request is fuzzy.
 * - `stopWhen` caps the loop at 10 steps, keeping the agent from over-iterating on simple answers.
 */
import { ToolLoopAgent, stepCountIs } from 'ai';
import { BASE_AGENT_RULES } from './baseInstructions';
import type { AgentFactoryParams } from './studentLookupAgent';
import { createGetAcademicTermsTool } from '../tools/getAcademicTermsTool';
import { createGetCurrentDateTool } from '../tools/getCurrentDateTool';

export function createGeneralAssistantAgent({ model, context }: AgentFactoryParams) {
  return new ToolLoopAgent({
    id: 'general_assistant',
    model,
    instructions: [
      BASE_AGENT_RULES,
      'You are the default assistant for the EntryPoint SRM chat experience.',
      'Capabilities:',
      '- Answer high-level usage questions about the SRM.',
      '- Provide friendly guidance, next steps, or point to where something lives when the request is broad.',
      '- Use get_current_date to confirm the present day or timezone before answering time-sensitive questions.',
      '- Use get_academic_terms when the user needs to know which term covers a specific date. Assume the current school year unless specified otherwise.',
      '- If the user clearly needs student-specific work or analytics, respond briefly and suggest they ask in a way that triggers the specialist agents.',
      'If the user request requires tools you do not own, reply with guidance and indicate which specialist agent the user should engage.'
    ].join('\n\n'),
    stopWhen: stepCountIs(10),
    tools: {
      get_current_date: createGetCurrentDateTool(),
      get_academic_terms: createGetAcademicTermsTool(context)
    }
  });
}
