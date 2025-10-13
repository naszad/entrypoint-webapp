/**
 * Types and interfaces for AI chat tools
 */

export interface ToolMetadata {
  name: string;
  category: 'navigation' | 'data_query' | 'student' | 'utility';
  description: string;
  systemMessageRules?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ChatTool<TInput = any> {
  metadata: ToolMetadata;
  definition: TInput; // Will be a tool from ai SDK
}

export interface ToolContext {
  selectedSchoolId?: string;
  userId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
