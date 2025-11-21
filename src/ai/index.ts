export type { ToolContext } from './tools/types';
export { createIdentifyStudentTool } from './tools/identifyStudentTool';
export { createListDatabaseViewsTool } from './tools/listDatabaseViewsTool';
export { createGetViewSchemaTool } from './tools/getViewSchemaTool';
export { createFilterStudentsTool } from './tools/filterStudentsTool';
export { createFilterGradesTool } from './tools/filterGradesTool';
export { createNavigateTool } from './tools/navigateTool';
export { createGetAcademicTermsTool } from './tools/getAcademicTermsTool';
export { createSelectRelevantViewsTool, selectRelevantViews } from './tools/selectRelevantViewsTool';
export { createTagInsightsTool } from './tools/tagInsightsTool';
export { createSqlPlanTool } from './tools/sqlPlanTool';
export { createEvaluateSqlTool } from './tools/evaluateSqlTool';
export { createExecuteSqlTool } from './tools/executeSqlTool';
export { createFindTaggedStudentsTool } from './tools/findTaggedStudentsTool';
export type {
  TagDescriptor,
  TagInsightsMetadata,
  TagInsightsPayload,
  CohortQuerySpec,
  CohortQueryTagFilter,
  CohortQueryTerm,
  CohortNumericCondition,
  CohortMetricRequest,
  NumericComparisonOperator,
} from './types/cohort';
export type { SqlPlan, SqlEvaluationFeedback, SqlExecutionResult, SqlEvaluationSeverity } from './types/sql';
export { createAgentRegistry, type AgentRegistry, agentRoutingProfiles, type AgentRoutingProfile, type AgentId } from './agents';
export { routeAgent, type RoutingDecision, type RoutingInput } from './router';

import type { LanguageModel } from 'ai';
import type { ToolContext } from './tools/types';
import { createAgentRegistry, agentRoutingProfiles } from './agents';
import { routeAgent } from './router';
import type { RoutingInput } from './router';
import type { SqlEvaluationFeedback } from './types/sql';

export interface AgentRuntimeOptions {
  model: LanguageModel;
  context: ToolContext;
}

// Instantiates the shared agent registry per request while carrying forward a SQL evaluation cache
// so repeated plans avoid re-running expensive checks within the same runtime cycle.
export function createAgentRuntime(options: AgentRuntimeOptions) {
  const sqlEvaluationCache: Map<string, SqlEvaluationFeedback> =
    options.context.sqlEvaluationCache ?? new Map<string, SqlEvaluationFeedback>();

  const contextWithCache: ToolContext = {
    ...options.context,
    sqlEvaluationCache,
  };

  const agents = createAgentRegistry({ model: options.model, context: contextWithCache });

  return {
    agents,
    decide: async (input: Omit<RoutingInput, 'agents' | 'model' | 'profiles'>) =>
      routeAgent({ ...input, agents, model: options.model, profiles: agentRoutingProfiles })
  };
}
