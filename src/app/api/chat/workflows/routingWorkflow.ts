import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod/v3';
import type { ToolRegistry } from '../tools';

export type WorkflowCategory = 'general' | 'navigation' | 'data_query' | 'student_specific';

interface WorkflowConfig {
  id: WorkflowCategory;
  label: string;
  description: string;
  systemInstruction: string;
  toolNames: string[];
  workflowId: 'general_assistant' | 'navigation_assistant' | 'data_query_assistant' | 'student_insights_assistant';
}

const DEFAULT_ROUTER_MODEL = 'gpt-4o';
const ALL_TOOL_NAMES = [
  'filter_students',
  'filter_grades',
  'list_tables',
  'get_table_schema',
  'execute_sql',
  'identify_student',
  'get_student_gpa',
] as const;

const WORKFLOW_CONFIGS: Record<WorkflowCategory, WorkflowConfig> = {
  navigation: {
    id: 'navigation',
    label: 'Navigation Workflow',
    description:
      'Use when the user query can be addressed by filtering students or grades and navigating them to those views in the UI.',
    systemInstruction:
      'Focus on navigation and UI actions. Prefer using navigation tools to generate actionable filters rather than answering from memory. Explain to the user what view or filter is being applied.',
    toolNames: [...ALL_TOOL_NAMES],
    workflowId: 'navigation_assistant',
  },
  data_query: {
    id: 'data_query',
    label: 'Data Insights Workflow',
    description:
      'Use when the user needs an answer that requires querying the database, aggregating data, or tag related data.',
    systemInstruction:
      'Act as an analytical data specialist. Use schema exploration tools before executing SQL. Clearly explain the query logic and summarize key results without exposing raw SQL.',
    toolNames: [...ALL_TOOL_NAMES],
    workflowId: 'data_query_assistant',
  },
  student_specific: {
    id: 'student_specific',
    label: 'Student Exploration Workflow',
    description:
      'Use when the user is asking about a specific student or a small set of identified students.',
    systemInstruction:
      'Ensure a student is identified before referencing their data. Use identify_student to disambiguate names, then apply student-focused tools or targeted queries. Confirm with the user when multiple matches exist.',
    toolNames: [...ALL_TOOL_NAMES],
    workflowId: 'student_insights_assistant',
  },
  general: {
    id: 'general',
    label: 'General Assistant Workflow',
    description:
      'Use when the request is conversational, policy related, or does not map cleanly to navigation or data retrieval.',
    systemInstruction:
      'Provide clear, concise assistance. Draw on prior conversation context and only reference tools if absolutely necessary. If tools are required, explain why before using them.',
    toolNames: [...ALL_TOOL_NAMES],
    workflowId: 'general_assistant',
  },
};

const routingSchema = z.object({
  category: z.enum(['navigation', 'data_query', 'student_specific', 'general']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  recommendedTools: z.array(z.string()).optional(),
});

export interface RoutingDecision {
  category: WorkflowCategory;
  confidence: number;
  reasoning: string;
  workflow: WorkflowConfig;
  toolNames: string[];
  workflowId: WorkflowConfig['workflowId'];
}

interface RouteChatRequestParams {
  latestUserMessage: string;
  conversationSummary?: string;
  toolRegistry: ToolRegistry;
  routerModel?: string;
}

const DEFAULT_DECISION: RoutingDecision = {
  category: 'general',
  confidence: 0.5,
  reasoning: 'Defaulted to general assistant workflow.',
  workflow: WORKFLOW_CONFIGS.general,
  toolNames: [...WORKFLOW_CONFIGS.general.toolNames],
  workflowId: WORKFLOW_CONFIGS.general.workflowId,
};

export async function routeChatRequest({
  latestUserMessage,
  conversationSummary,
  toolRegistry,
  routerModel,
}: RouteChatRequestParams): Promise<RoutingDecision> {
  if (!latestUserMessage?.trim()) {
    return DEFAULT_DECISION;
  }

  const modelName = routerModel ?? DEFAULT_ROUTER_MODEL;
  const availableTools = Array.from(toolRegistry.getAllTools().keys());
  const describeWorkflows = Object.values(WORKFLOW_CONFIGS)
    .map(
      (workflow) =>
        `- ${workflow.label} [${workflow.id}]: ${workflow.description}. Default tools: ${workflow.toolNames.join(', ') || 'None'}`,
    )
    .join('\n');

  try {
    const { object: routingResult } = await generateObject({
      model: openai(modelName),
      schema: routingSchema,
      system: `You are a routing controller for a school counseling assistant. Choose the single best workflow for the latest user request.
Available workflows:
${describeWorkflows}

Always pick exactly one category. Recommend tool names that exist in the provided defaults for that workflow. If no tools are required, return an empty list.`,
      prompt: `Latest user message:
"${latestUserMessage}"

${conversationSummary ? `Recent conversation context:\n${conversationSummary}\n` : ''}
Available tool names: ${availableTools.join(', ')}.`,
    });

    const category = WORKFLOW_CONFIGS[routingResult.category]?.id ?? 'general';
    const workflow = WORKFLOW_CONFIGS[category];
    const recommendedFromModel =
      routingResult.recommendedTools?.filter((name) => workflow.toolNames.includes(name)) ?? [];

    const filteredByAvailability = (recommendedFromModel.length > 0 ? recommendedFromModel : workflow.toolNames).filter(
      (name) => availableTools.includes(name),
    );

    const uniqueToolNames = Array.from(new Set(filteredByAvailability));

    return {
      category,
      confidence: routingResult.confidence,
      reasoning: routingResult.reasoning,
      workflow,
      toolNames: uniqueToolNames,
      workflowId: workflow.workflowId,
    };
  } catch (error) {
    console.error('Routing workflow failed; defaulting to general workflow.', error);
    return DEFAULT_DECISION;
  }
}
