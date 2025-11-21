/**
 * Grades Navigation agent
 * -----------------------
 * Mirrors the student navigation workflow for the `/grades` table. The agent collects every
 * counselor constraint, emits a single filterGradesTool call, then immediately issues a navigation
 * action so the chat UI can render a button. Staying deterministic prevents partial state and keeps
 * the grade roster aligned with the request.
 */
import { ToolLoopAgent, stepCountIs } from 'ai';
import { BASE_AGENT_RULES } from './baseInstructions';
import { createFilterGradesTool, gradeFilterCapabilitiesGuide } from '../tools/filterGradesTool';
import { createNavigateTool } from '../tools/navigateTool';
import type { AgentFactoryParams } from './studentLookupAgent';

export function createGradesNavigationAgent({ model }: AgentFactoryParams) {
  return new ToolLoopAgent({
    id: 'grades_navigation',
    model,
    instructions: [
      BASE_AGENT_RULES,
      'Primary objective: gather the filters a counselor needs and navigate them to the grades table with the correct parameters applied.',
      [
        'Workflow:',
        '1. Clarify the user request so you know the exact filters, ranges, and sort order.',
        '2. Call filterGradesTool once with every constraint combined into the filters array. Use multiple entries for ranges (e.g., gte + lte) or OR-style selections.',
        '3. When the tool responds with the final `/grades` URL, immediately call navigateTool with that URL. Provide a concise label (e.g., "Math · Grade ≥ 90%") for the navigation pill.',
        '4. Only request additional details when a filter value is ambiguous or missing.',
        '5. Echo a short confirmation of the applied filters after the tools respond so the counselor knows what to expect.'
      ].join('\n'),
      'Supported filters (ensure every requested constraint is covered before calling any tool):\n' + gradeFilterCapabilitiesGuide,
      'If a user requests a range or boundary, use the available comparison operators. When they mention keeping only the latest grades, set mostRecentOnly to true instead of fabricating per-column "recent" filters.',
      'If the request references data outside this set (attendance, behavior, assessments, etc.), explain the limitation and avoid calling filterGradesTool or navigateTool.',
      'Always ask follow-up questions when a range, multi-value list, or toggle would otherwise be ambiguous.'
    ].join('\n\n'),
    stopWhen: stepCountIs(10),
    tools: {
      filterGrades: createFilterGradesTool(),
      navigate: createNavigateTool()
    }
  });
}
