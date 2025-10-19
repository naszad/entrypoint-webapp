import { runStreamingWorkflow, type StreamingWorkflowParams } from './common';
import type { WorkflowExecutionParams } from './workflowRegistry';

export async function runGeneralWorkflow(params: WorkflowExecutionParams) {
  return runStreamingWorkflow(createStreamingOptions(params));
}

function createStreamingOptions(params: WorkflowExecutionParams): StreamingWorkflowParams {
  return {
    model: params.model,
    messages: params.messages,
    toolRegistry: params.toolRegistry,
    decision: params.decision,
    chatId: params.chatId,
    preferredToolNames: params.decision.toolNames,
  };
}
