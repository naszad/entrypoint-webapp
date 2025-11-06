/**
 * Tool Registry
 * Aggregates and manages all chat tools
 */

import type { SqlEvaluationResult } from '../workflows/sqlEvaluationWorkflow';
import { ChatTool, ToolContext } from './types';
import systemMessageService from '../services/systemMessageService';

// Import all tools
import { filterStudentsTool } from './filterStudents';
import { filterGradesTool } from './filterGrades';
import { listTablesTool, getTableSchemaTool, executeSqlTool } from './databaseTools';
import { identifyStudentTool, getStudentGpaTool } from './studentTools';
import { getCurrentDateTool } from './dateTools';
import { getAcademicTermsTool } from './termTools';
import { listTagsTool, getTagValuesTool } from './tagTools';

export class ToolRegistry {
  private tools: Map<string, ChatTool> = new Map();
  private context: ToolContext;
  private sqlEvaluationCache: Map<string, SqlEvaluationResult> = new Map();

  constructor(context: ToolContext) {
    this.context = { ...context, sqlEvaluationCache: this.sqlEvaluationCache };
    this.registerTools();
  }

  private registerTools(): void {
    // Register navigation tools
    this.registerTool(filterStudentsTool);
    this.registerTool(filterGradesTool);

    // Register database query tools
    this.registerTool(listTablesTool);
    this.registerTool(getTableSchemaTool);
    this.registerTool(listTagsTool(this.context));
    this.registerTool(getTagValuesTool());
    this.registerTool(executeSqlTool(this.context));

    // Register student-specific tools
    this.registerTool(identifyStudentTool(this.context));
    this.registerTool(getStudentGpaTool(this.context));

    // Register utility tools
    this.registerTool(getCurrentDateTool);
    this.registerTool(getAcademicTermsTool(this.context));
  }

  private registerTool(tool: ChatTool): void {
    this.tools.set(tool.metadata.name, tool);

    // Register tool-specific rules with the system message service
    if (tool.metadata.systemMessageRules && tool.metadata.systemMessageRules.length > 0) {
      systemMessageService.registerToolRules({
        toolName: tool.metadata.name,
        description: tool.metadata.description,
        rules: tool.metadata.systemMessageRules
      });
    }
  }

  /**
   * Get all tools as a record for use with the AI SDK
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getToolsForAI(): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: Record<string, any> = {};

    for (const [name, tool] of Array.from(this.tools.entries())) {
      tools[name] = tool.definition;
    }

    return tools;
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): ChatTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Map<string, ChatTool> {
    return new Map(this.tools);
  }

  getContext(): ToolContext {
    const contextClone: ToolContext = { ...this.context };
    delete contextClone.sqlEvaluationCache;
    return contextClone;
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ChatTool['metadata']['category']): ChatTool[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.metadata.category === category);
  }

  /**
   * Update context (e.g., when selectedSchoolId changes)
   */
  updateContext(newContext: Partial<ToolContext>): void {
    this.context = { ...this.context, ...newContext, sqlEvaluationCache: this.sqlEvaluationCache };
    
    // Re-register context-dependent tools
    this.tools.delete('identify_student');
    this.tools.delete('list_tags');
    this.tools.delete('list_tag_values');
    this.tools.delete('execute_sql');
    this.tools.delete('get_student_gpa');
    this.tools.delete('get_academic_terms');
    
    this.registerTool(listTagsTool(this.context));
    this.registerTool(getTagValuesTool());
    this.registerTool(identifyStudentTool(this.context));
    this.registerTool(executeSqlTool(this.context));
    this.registerTool(getStudentGpaTool(this.context));
    this.registerTool(getAcademicTermsTool(this.context));
  }

  registerSqlEvaluation(sql: string, evaluation: SqlEvaluationResult): void {
    this.sqlEvaluationCache.set(normalizeSqlKey(sql), evaluation);
  }

  getSqlEvaluation(sql: string): SqlEvaluationResult | undefined {
    return this.sqlEvaluationCache.get(normalizeSqlKey(sql));
  }
}

/**
 * Factory function to create a tool registry with context
 */
export function createToolRegistry(context: ToolContext): ToolRegistry {
  return new ToolRegistry(context);
}

function normalizeSqlKey(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

// Export types for external use
export type { ChatTool, ToolContext, ToolMetadata } from './types';
