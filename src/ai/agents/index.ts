/**
 * Agent registry
 * --------------
 * Central wiring point that instantiates every agent with the shared language model and tool
 * context. Routing layers rely on this module to provide strongly typed handles plus descriptive
 * profiles (see `agentRoutingProfiles` below). By consolidating creation here we avoid circular
 * imports in individual agents and guarantee consistent tool configuration across the runtime.
 */
import type { LanguageModel } from 'ai';
import type { ToolContext } from '../tools/types';
import { studentFilterCapabilitiesGuide } from '../tools/filterStudentsTool';
import { gradeFilterCapabilitiesGuide } from '../tools/filterGradesTool';
import { createStudentLookupAgent, type AgentFactoryParams } from './studentLookupAgent';
import { createStudentNavigationAgent } from './studentNavigationAgent';
import { createGradesNavigationAgent } from './gradesNavigationAgent';
import { createGeneralAssistantAgent } from './generalAssistantAgent';
import { createTagInsightsAgent } from './tagInsightsAgent';
import { createSqlGeneratorAgent } from './sqlGeneratorAgent';
import { createDeepAnalysisAgent } from './deepAnalysisAgent';

export type StudentLookupAgent = ReturnType<typeof createStudentLookupAgent>;
export type StudentNavigationAgent = ReturnType<typeof createStudentNavigationAgent>;
export type GradesNavigationAgent = ReturnType<typeof createGradesNavigationAgent>;
export type TagInsightsAgent = ReturnType<typeof createTagInsightsAgent>;
export type DeepAnalysisAgent = ReturnType<typeof createDeepAnalysisAgent>;
export type SqlGeneratorAgent = ReturnType<typeof createSqlGeneratorAgent>;

export interface AgentRegistry {
  generalAssistant: ReturnType<typeof createGeneralAssistantAgent>;
  studentNavigation: StudentNavigationAgent;
  gradesNavigation: GradesNavigationAgent;
  studentLookup: StudentLookupAgent;
  tagInsights: TagInsightsAgent;
  deepAnalysis: DeepAnalysisAgent;
  sqlGenerator: SqlGeneratorAgent;
}

export interface CreateAgentRegistryOptions {
  model: LanguageModel;
  context: ToolContext;
}

/**
 * Instantiates each agent with shared dependencies. Downstream runtime calls this once per request
 * cycle so every agent shares the same evaluation cache, Supabase client, and language model.
 */
export function createAgentRegistry({ model, context }: CreateAgentRegistryOptions): AgentRegistry {
  const params: AgentFactoryParams = { model, context };
  const generalAssistant = createGeneralAssistantAgent(params);
  const studentNavigation = createStudentNavigationAgent(params);
  const gradesNavigation = createGradesNavigationAgent(params);
  const studentLookup = createStudentLookupAgent(params);
  const tagInsights = createTagInsightsAgent(params);
  const sqlGenerator = createSqlGeneratorAgent(params);
  const deepAnalysis = createDeepAnalysisAgent(params);

  return {
    generalAssistant,
    studentNavigation,
    gradesNavigation,
    studentLookup,
    tagInsights,
    deepAnalysis,
    sqlGenerator
  };
}

export type AgentId = keyof AgentRegistry;

export interface AgentRoutingProfile {
  agentId: AgentId;
  displayName: string;
  description: string;
  idealFor: string[];
  avoidWhen?: string[];
  notes?: string[];
  priority?: 'default' | 'fallback' | 'specialist';
}

/**
 * Describes when each agent should be selected. Router heuristics and UI surfaces pull from these
 * profiles, so keep descriptions counselor-facing and aligned with the actual capabilities coded
 * into the agents above.
 */
export const agentRoutingProfiles: Record<AgentId, AgentRoutingProfile> = {
  generalAssistant: {
    agentId: 'generalAssistant',
    displayName: 'General Assistant',
    description:
      'Handles broad SRM questions, onboarding help, and requests that fall outside specialist tools. Acts as the safety net when intent is ambiguous or unsupported.',
    idealFor: [
      'Clarifying vague or multi-part questions before handing off to specialists',
      'Product guidance, navigation help, and “how do I” style questions',
      'Requests mentioning unsupported data domains (discipline incidents, intervention logs, scheduling constraints, etc.)'
    ],
    avoidWhen: [
      'The user clearly needs a student filter, roster navigation, or analytics workflow that a specialist agent covers'
    ],
    notes: [
      'When routed here due to low confidence, begin by asking the user a concise clarifying question before attempting to solve the task.',
      'Use get_academic_terms when counselors need to know which term covers a specific date and no specialist agent is required.'
    ],
    priority: 'fallback'
  },
  studentNavigation: {
    agentId: 'studentNavigation',
    displayName: 'Student Navigation Agent',
    description:
      'Builds filtered `/students` URLs based on counselor requests and navigates the user to the roster with the correct columns and sort applied.',
    idealFor: [
      'Requests that can be satisfied entirely with roster filters and sorts',
      'Combining multiple supported constraints (e.g., grade ranges, GPA thresholds, enrollment status, homeroom)',
      'Situations where the user explicitly wants to view a student list with applied filters'
    ],
    avoidWhen: [
      'The request references data that is not available in the student columns (attendance counts, discipline incidents, interventions, assessments, etc.)',
      'The user is asking for analytics or aggregated metrics rather than a filtered list'
    ],
    notes: [
      'Supported columns and operators:\n' + studentFilterCapabilitiesGuide,
      'If any requested constraint falls outside this list, decline and escalate instead of emitting a partial filter.'
    ],
    priority: 'specialist'
  },
  gradesNavigation: {
    agentId: 'gradesNavigation',
    displayName: 'Grades Navigation Agent',
    description:
      'Builds filtered `/grades` URLs based on counselor requests and navigates the user to the grade roster with the correct columns and sort applied.',
    idealFor: [
      'Requests to view grades with specific filters or sort order',
      'Combining multiple grade-related constraints (course, letter, percentage ranges, grade codes)',
      'Situations where the user explicitly wants the grades table with filters applied'
    ],
    avoidWhen: [
      'The request references data outside the grades table (behavior, attendance, analytics, etc.)',
      'The counselor is asking for aggregate metrics rather than a filtered grade view'
    ],
    notes: [
      'Supported columns and operators:\n' + gradeFilterCapabilitiesGuide,
      'Set mostRecentOnly when the counselor wants only the latest grade per course; otherwise leave the toggle untouched.'
    ],
    priority: 'specialist'
  },
  studentLookup: {
    agentId: 'studentLookup',
    displayName: 'Student Lookup Agent',
    description:
      'Identifies a specific student when the user references a name or identifier, and returns profile links for confirmation before performing further actions.',
    idealFor: [
      'Requests mentioning a particular student name, student number, or identifier',
      'Situations where multiple students may match and confirmation is required before continuing'
    ],
    avoidWhen: [
      'The user wants a list or cohort of students',
      'The user is asking for analytics or aggregates',
      'The user clearly needs the student navigation filters instead',
      'The request is continuing an analytics answer (referencing "those students", "they", etc.) rather than identifying a brand-new individual'
    ],
    notes: [
      'If the user also asks for analytics after identification, hand off to the appropriate specialist once the student is confirmed.',
      'Defer to the deep analysis orchestrator when the counselor is simply asking for the names behind a cohort you already computed.'
    ],
    priority: 'specialist'
  },
  tagInsights: {
    agentId: 'tagInsights',
    displayName: 'Tag Insights Agent',
    description:
      'Explores qualitative tags—such as college goals, interests, clubs, or athletics—and returns structured descriptors counselors can reuse.',
    idealFor: [
      'Questions focused entirely on qualitative descriptors or tag metadata',
      'Understanding which tags exist before planning follow-up workflows'
    ],
    avoidWhen: [
      'The request requires quantitative analysis or non-tag data sources',
      'The user primarily needs a filtered roster view rather than qualitative insight'
    ],
    notes: [
      'Outputs structured tag descriptors (tag_id, tag_name, tag_values) plus usage metadata so other agents can compose cohort logic without re-deriving tags.'
    ],
    priority: 'specialist'
  },
  deepAnalysis: {
    agentId: 'deepAnalysis',
    displayName: 'Deep Analysis Orchestrator',
    description:
      'Can use various data tools to try and answer a broad set of questions about both quantiative and qualitative data, including students (and their interests/goals), courses, grades, absences, and other areas.',
    idealFor: [
      'Questions that are not easily answered by other specialist agents.',
      'Requests that combine qualitative aspects (e.g. interests, goals, clubs, athletics, college, etc) or cohorts with quantitative and numeric measures (e.g., GPA thresholds, credits)',
      'Questions that require gathering tag metadata or academic term context before executing SQL',
      'Auditable analytics asks where the counselor wants both the narrative and the exact count/metric',
      'Attendance and absence analytics, including counts, rates, and ranking the highest or lowest values',
      'Follow-up questions that reference a previously computed cohort or metric (e.g., "Who are they?", "Can you list the students?")'
    ],
    avoidWhen: [
      'The counselor only needs qualitative tag descriptions (route to tagInsights)',
      'Navigation-only requests that can be solved with roster filters'
    ],
    notes: [
      'Runs a deterministic sequence: resolve tags, resolve academic terms when needed, then execute the SQL plan/evaluate/execute workflow with the collected context.',
      'Use this when counselors ask, “Which students...with GPA above...?”, “How many tagged students last semester...?”, or similar multi-constraint or aggregate analytics.',
      'When the counselor follows up with pronouns or shorthand about the prior result, stay in this agent and expand the cohort details unless the topic clearly shifts.'
    ],
    priority: 'specialist'
  },
  sqlGenerator: {
    agentId: 'sqlGenerator',
    displayName: 'SQL Generator Agent',
    description:
      'Specializes in drafting, evaluating, and executing safe SQL queries against curated analytics views when counselors need precise metrics.',
    idealFor: [
      'Requests for specific counts, averages, percentages, or cohort stats that require executing SQL on curated views',
      'Situations where the counselor explicitly asks for the SQL used or requires auditable query steps',
      'Follow-ups after tag insights when quantitative validation is necessary'
    ],
    avoidWhen: [
      'The task can be satisfied with existing reports or navigation filters without custom SQL',
      'The counselor is asking for unsupported data domains outside the curated views catalog'
    ],
    notes: [
      'Always begin with a structured plan and share plan, evaluation, and execution highlights in the final response.',
      'Use evaluateSql before executing and respect cached evaluations to limit redundant checks.',
      'Default to student_profiles.grade_level for grade-related cohorts unless the schema comments indicate a better source.'
    ],
    priority: 'specialist'
  }
};
