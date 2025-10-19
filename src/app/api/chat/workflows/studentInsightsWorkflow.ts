import { runStreamingWorkflow, type StreamingWorkflowParams } from './common';
import type { WorkflowExecutionParams } from './workflowRegistry';

export async function runStudentInsightsWorkflow(params: WorkflowExecutionParams) {
  return runStreamingWorkflow(createStreamingOptions(params));
}

function createStreamingOptions(params: WorkflowExecutionParams): StreamingWorkflowParams {
  const extraInstructions: string[] = [
    'Always confirm student identity using identify_student before referencing individual data.',
    'If multiple students match, present the options and wait for clarification.',
    'When sharing insights, cite the source (e.g., tags, meeting notes) and provide internal links where appropriate.',
  ];

  return {
    model: params.model,
    messages: params.messages,
    toolRegistry: params.toolRegistry,
    decision: params.decision,
    chatId: params.chatId,
    preferredToolNames: params.decision.toolNames,
    additionalSystemInstructions: extraInstructions,
  };
}
