import { runStreamingWorkflow, type StreamingWorkflowParams } from './common';
import type { WorkflowExecutionParams } from './workflowRegistry';

export async function runNavigationWorkflow(params: WorkflowExecutionParams) {
  return runStreamingWorkflow(createStreamingOptions(params));
}

function createStreamingOptions(params: WorkflowExecutionParams): StreamingWorkflowParams {
  const additionalInstructions: string[] = [
    'Focus on navigation outcomes. When the user requests filtered views or lists, use the navigation tools to apply filters rather than answering from memory.',
    'Describe to the user what filters or navigation actions you applied so they understand the resulting view.',
  ];

  return {
    model: params.model,
    messages: params.messages,
    toolRegistry: params.toolRegistry,
    decision: params.decision,
    chatId: params.chatId,
    preferredToolNames: params.decision.toolNames,
    additionalSystemInstructions: additionalInstructions,
  };
}
