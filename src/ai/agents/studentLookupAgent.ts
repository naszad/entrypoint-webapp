/**
 * Student Lookup agent
 * --------------------
 * Handles disambiguating student references before any downstream workflow runs. The agent owns
 * a deterministic identify-student tool and falls back to schema inspection when the counselor’s
 * request morphs into analytics mid-conversation. Keeping this hop isolated prevents other
 * specialists from guessing which student to use and keeps profile links consistent.
 *
 * Key behaviors:
 * - Prompt emphasizes confirmation when multiple matches appear so the counselor always validates
 *   the final student.
 * - Provides Markdown links to SRM profiles, matching the UX pattern elsewhere in chat.
 * - Exposes listDatabaseViews for quick schema surfacing when the conversation pivots toward data
 *   exploration after identification; the agent itself still defers heavy analytics to specialists.
 */
import { ToolLoopAgent, stepCountIs } from 'ai';
import type { LanguageModel } from 'ai';
import { BASE_AGENT_RULES } from './baseInstructions';
import { createIdentifyStudentTool } from '../tools/identifyStudentTool';
import { createListDatabaseViewsTool } from '../tools/listDatabaseViewsTool';
import type { ToolContext } from '../tools/types';

export interface AgentFactoryParams {
  model: LanguageModel;
  context: ToolContext;
}

export function createStudentLookupAgent({ model, context }: AgentFactoryParams) {
  return new ToolLoopAgent({
    id: 'student_lookup',
    model,
    instructions: [
      BASE_AGENT_RULES,
      'Primary objective: help the user identify the correct student before taking any further action.',
      [
        'Workflow:',
        '1. Run identifyStudentTool when the user references a student.',
        '2. If multiple matches surface, present them with grade level and student number and ask for confirmation before proceeding.',
        '3. Always present student names as a Markdown link to their profile in the SRM using the URL you get from the identifyStudentTool.',
        '   - Use the profilePath exactly as returned (it already begins with `/`). Never add a protocol or domain.',
      ].join('\n'),
      'If the query evolves into broader analytics, you may defer to another specialist agent after confirming the student.'
    ].join('\n\n'),
    stopWhen: stepCountIs(12),
    tools: {
      identifyStudent: createIdentifyStudentTool(context),
      listDatabaseViews: createListDatabaseViewsTool(context)
    }
  });
}
