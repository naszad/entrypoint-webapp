/**
 * Student Navigation agent
 * ------------------------
 * Specializes in translating conversational filter requests into roster navigation URLs. The
 * agent’s instructions mirror the product UX—collect every constraint in a single pass, call the
 * filter tool once, and immediately emit a navigation action. This keeps the roster filter state
 * deterministic and ensures counselors get a clickable button at the end of the exchange.
 *
 * Implementation notes:
 * - We expose both the filter builder and navigate tools; the workflow section of the prompt
 *   enforces the “filter then navigate” contract.
 * - The long capabilities guide is inlined so the LLM can validate that each requested constraint
 *   is supported before calling tools.
 * - `stopWhen` is kept small (10) because the agent either emits a filter quickly or declines when
 *   constraints fall outside the supported set.
 */
import { ToolLoopAgent, stepCountIs } from 'ai';
import { BASE_AGENT_RULES } from './baseInstructions';
import { createFilterStudentsTool, studentFilterCapabilitiesGuide } from '../tools/filterStudentsTool';
import { createNavigateTool } from '../tools/navigateTool';
import type { AgentFactoryParams } from './studentLookupAgent';

export function createStudentNavigationAgent({ model }: AgentFactoryParams) {
  return new ToolLoopAgent({
    id: 'student_navigation',
    model,
    instructions: [
      BASE_AGENT_RULES,
      'Primary objective: gather the filters a counselor needs and navigate them to the students table with the correct parameters applied.',
      [
        'Workflow:',
        '1. Clarify the user request so you know the exact filters, ranges, and sort order.',
        '2. Call filterStudentsTool once with every constraint combined into the filters array. Add multiple entries for range bounds or OR-style grade selections.',
        '3. When the tool responds with the final `/students` URL, immediately call navigateTool with that URL. Pass a concise label (e.g., “Grade 9 · GPA ≥ 3.5”) so the button in chat history stays useful.',
        '4. Only request additional details if a filter value is ambiguous or missing.',
        '5. Echo a short confirmation of the applied filters after the tools respond so the counselor knows what to expect.'
      ].join('\n'),
      'Supported filters (you must be able to satisfy every user constraint with this list before calling any tool):\n' + studentFilterCapabilitiesGuide,
      'If a user requests a less than or greater than comparison, you can use the "or equal to" variants of those operators if that is the only option for a given field. For example, use "lte" when the user says "less than".',
      'If a request references data outside this set (e.g., attendance counts, discipline, assessments), explain the limitation and avoid calling filterStudentsTool or navigateTool.',
      'Always ask follow-up questions when a time range, grade list, or inclusion of inactive students is unclear.'
    ].join('\n\n'),
    stopWhen: stepCountIs(10),
    tools: {
      filterStudents: createFilterStudentsTool(),
      navigate: createNavigateTool()
    }
  });
}
