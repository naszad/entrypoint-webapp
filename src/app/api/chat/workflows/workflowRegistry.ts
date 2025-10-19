import type { ToolRegistry } from '../tools';
import type { RoutingDecision } from './routingWorkflow';
import type { WorkflowMessage } from './common';
import { runGeneralWorkflow } from './generalWorkflow';
import { runNavigationWorkflow } from './navigationWorkflow';
import { runDataQueryWorkflow } from './dataQueryWorkflow';
import { runStudentInsightsWorkflow } from './studentInsightsWorkflow';
import type { WorkflowStream } from './common';

export type WorkflowId =
  | 'general_assistant'
  | 'navigation_assistant'
  | 'data_query_assistant'
  | 'student_insights_assistant';

export interface WorkflowExecutionParams {
  messages: WorkflowMessage[];
  model: string;
  toolRegistry: ToolRegistry;
  decision: RoutingDecision;
  chatId: string;
  latestUserMessage?: string;
  conversationSummary?: string;
}

type WorkflowHandler = (params: WorkflowExecutionParams) => Promise<WorkflowStream>;

const workflowHandlers: Record<WorkflowId, WorkflowHandler> = {
  general_assistant: runGeneralWorkflow,
  navigation_assistant: runNavigationWorkflow,
  data_query_assistant: runDataQueryWorkflow,
  student_insights_assistant: runStudentInsightsWorkflow,
};

export async function runWorkflow(params: WorkflowExecutionParams) {
  const handler = workflowHandlers[params.decision.workflowId] ?? runGeneralWorkflow;
  return handler(params);
}
