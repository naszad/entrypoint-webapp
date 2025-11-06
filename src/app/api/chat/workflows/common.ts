import { streamText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';
import { createClient } from '@/utils/supabase/supabaseServer';
import systemMessageService from '../services/systemMessageService';
import type { RoutingDecision } from './routingWorkflow';
import type { ToolRegistry } from '../tools';

type StreamTextArgs = Parameters<typeof streamText>[0];
export type WorkflowMessage = NonNullable<StreamTextArgs['messages']>[number];

export interface StreamingWorkflowContext {
  name: string;
  summary: string;
  data: unknown;
}

export interface StreamingWorkflowParams {
  model: string;
  messages: WorkflowMessage[];
  toolRegistry: ToolRegistry;
  decision: RoutingDecision;
  chatId: string;
  preferredToolNames: string[];
  additionalSystemInstructions?: string[];
  stepLimit?: number;
  contexts?: StreamingWorkflowContext[];
}

export function runStreamingWorkflow({
  model,
  messages,
  toolRegistry,
  decision,
  chatId,
  preferredToolNames,
  additionalSystemInstructions,
  stepLimit,
  contexts,
}: StreamingWorkflowParams) {
  const systemInstructionParts = [
    systemMessageService.buildSystemMessage(preferredToolNames),
    decision.workflow.systemInstruction,
    ...(additionalSystemInstructions ?? []),
  ].filter(Boolean);

  if (preferredToolNames.length > 0) {
    systemInstructionParts.push(
      `Preferred tools for this workflow: ${preferredToolNames.join(
        ', ',
      )}. You may use other tools when appropriate, but default to these when they fit the request.`,
    );
  }

  const formattingReminder = systemMessageService.buildFormattingReminderBlock();
  if (formattingReminder) {
    systemInstructionParts.push(formattingReminder);
  }

  const systemMessage = systemInstructionParts.join('\n\n');
  const toolsForAI = toolRegistry.getToolsForAI();

  console.log(`Running workflow ${decision.workflow.id}`)
  const stream = streamText({
    model: openai(model),
    system: systemMessage,
    messages,
    stopWhen: stepCountIs(stepLimit ?? 15),
    tools: toolsForAI,
    onFinish: async (finishData) => {
      await persistAssistantResponse({
        chatId,
        finishData,
        decision,
        contexts: contexts ?? [],
      });
    },
    onStepFinish: (step) => {
      if (step.toolCalls && step.toolCalls.length > 0) {
        for (const toolCall of step.toolCalls) {
          console.log(`Tool called: ${toolCall.toolName}`, {
            input: 'args' in toolCall ? toolCall.args : toolCall.input,
            toolCallId: toolCall.toolCallId,
          });
        }
      }

      if (step.toolResults && step.toolResults.length > 0) {
        for (const toolResult of step.toolResults) {
          console.log(`Tool result: ${toolResult.toolName}`, {
            output: 'result' in toolResult ? toolResult.result : toolResult.output,
            toolCallId: toolResult.toolCallId,
          });
        }
      }
    },
  });

  return stream;
}

export type WorkflowStream = ReturnType<typeof runStreamingWorkflow>;

interface PersistAssistantResponseParams {
  chatId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finishData: any;
  decision: RoutingDecision;
  contexts: StreamingWorkflowContext[];
}

async function persistAssistantResponse({
  chatId,
  finishData,
  decision,
  contexts,
}: PersistAssistantResponseParams): Promise<void> {
  if (!chatId) {
    return;
  }

  try {
    const supabase = await createClient();
    const parts = buildAssistantParts(finishData);

    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      role: 'assistant',
      parts,
      created_at: new Date(),
      metadata: {
        finishReason: finishData.finishReason,
        usage: finishData.usage,
        toolCalls: finishData.toolCalls || [],
        toolResults: finishData.toolResults || [],
        routing: {
          category: decision.category,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          workflowId: decision.workflow.id,
          toolNames: decision.toolNames,
        },
        supportingContexts: contexts.map((context) => ({
          name: context.name,
          summary: context.summary,
          data: context.data,
        })),
      },
    });
  } catch (error) {
    console.error('Error saving AI response:', error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAssistantParts(finishData: any): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [];

  if (finishData.steps && finishData.steps.length > 0) {
    for (const step of finishData.steps) {
      if (!step?.content || !Array.isArray(step.content)) {
        continue;
      }

      for (const contentItem of step.content) {
        if (contentItem.type === 'tool-call') {
          parts.push({
            type: 'tool-call',
            toolCallId: contentItem.toolCallId,
            toolName: contentItem.toolName,
            input: contentItem.input,
          });
        } else if (contentItem.type === 'tool-result') {
          if (contentItem.toolName === 'filter_students') {
            parts.push({
              type: 'tool-filter_students',
              toolCallId: contentItem.toolCallId,
              toolName: contentItem.toolName,
              output: contentItem.output,
            });
          } else if (contentItem.toolName === 'filter_grades') {
            parts.push({
              type: 'tool-filter_grades',
              toolCallId: contentItem.toolCallId,
              toolName: contentItem.toolName,
              output: contentItem.output,
            });
          } else {
            parts.push({
              type: 'dynamic-tool',
              toolCallId: contentItem.toolCallId,
              toolName: contentItem.toolName,
              output: contentItem.output,
            });
          }
        } else if (contentItem.type === 'text') {
          parts.push({
            type: 'text',
            text: contentItem.text,
          });
        }
      }
    }
  }

  if (finishData.text && !parts.some((part) => part.type === 'text')) {
    parts.push({ type: 'text', text: finishData.text });
  }

  return parts;
}

const SCHEMA_CACHE_DIR = '.cache/schema';
let ensureCacheDirPromise: Promise<void> | null = null;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}

async function ensureCacheDir(): Promise<void> {
  if (ensureCacheDirPromise) {
    return ensureCacheDirPromise;
  }

  ensureCacheDirPromise = fs.promises
    .mkdir(SCHEMA_CACHE_DIR, { recursive: true })
    .then(() => undefined)
    .catch((error) => {
      console.error('Failed to ensure schema cache directory', error);
    });

  return ensureCacheDirPromise;
}

async function readSchemaFromCache(tableName: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    const filePath = `${SCHEMA_CACHE_DIR}/${sanitizeFileName(tableName)}.json`;
    const content = await fs.promises.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as { formatted: string };
    return parsed.formatted;
  } catch {
    return null;
  }
}

async function writeSchemaToCache(tableName: string, formatted: string): Promise<void> {
  try {
    await ensureCacheDir();
    const filePath = `${SCHEMA_CACHE_DIR}/${sanitizeFileName(tableName)}.json`;
    await fs.promises.writeFile(
      filePath,
      JSON.stringify({ tableName, formatted, updatedAt: new Date().toISOString() }),
      'utf8',
    );
  } catch (error) {
    console.error(`Failed to cache schema for table ${tableName}`, error);
  }
}

function extractPotentialTableNames(sql: string): string[] {
  const normalizedSql = sql ?? '';
  const tableRegex = /\b(?:from|join)\s+([a-zA-Z0-9_."`]+)/gi;
  const matches = new Set<string>();

  let result: RegExpExecArray | null;
  while ((result = tableRegex.exec(normalizedSql)) !== null) {
    const raw = result[1] ?? '';
    const cleaned = raw.replace(/["]|[`]/g, '').split(/\s|,/)[0];
    if (!cleaned) {
      continue;
    }
    const [schema, table] = cleaned.includes('.') ? cleaned.split('.') : [null, cleaned];
    const candidate = (table ?? schema ?? cleaned).trim();
    if (candidate) {
      matches.add(candidate);
    }
  }

  return Array.from(matches);
}

async function getFormattedSchemaForTable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tableName: string,
  warnings: string[],
): Promise<string | null> {
  const cached = await readSchemaFromCache(tableName);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase.rpc('get_view_schema', {
    p_view_name: tableName,
  });

  if (error) {
    warnings.push(`Failed to fetch schema for ${tableName}: ${error.message}`);
    return null;
  }

  if (!Array.isArray(data) || data.length === 0) {
    warnings.push(`Schema for ${tableName} is empty or unavailable.`);
    return null;
  }

  const formattedColumns = data
    .map((column: Record<string, unknown>) => {
      const columnName = column.column_name ?? column.columnName ?? 'unknown_column';
      const dataType = column.data_type ?? column.dataType ?? 'unknown_type';
      const comment = column.column_comment ?? column.comment ?? '';
      return `${String(columnName)} (${String(dataType)})${comment ? ` - ${String(comment)}` : ''}`;
    })
    .join('; ');

  const formatted = `Table ${tableName}: ${formattedColumns}`;
  await writeSchemaToCache(tableName, formatted);
  return formatted;
}

export interface SchemaSummaryOptions {
  sql?: string;
}

export interface SchemaSummaryResult {
  summary: string | null;
  tableNames: string[];
  referencedTables: string[];
  warnings: string[];
}

export async function buildSchemaSummary(options: SchemaSummaryOptions = {}): Promise<SchemaSummaryResult> {
  const warnings: string[] = [];
  let supabaseClient: Awaited<ReturnType<typeof createClient>>;

  try {
    supabaseClient = await createClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    warnings.push(`Failed to initialize Supabase client: ${message}`);
    return {
      summary: null,
      tableNames: [],
      referencedTables: [],
      warnings,
    };
  }

  const { data: tablesData, error: tablesError } = await supabaseClient.rpc('list_views');
  if (tablesError || !Array.isArray(tablesData)) {
    warnings.push(`Failed to fetch table list: ${tablesError?.message ?? 'Unknown error'}`);
    return {
      summary: null,
      tableNames: [],
      referencedTables: [],
      warnings,
    };
  }

  const availableTables = tablesData.map((entry: { name: string }) => entry.name).filter(Boolean);

  let referencedTables: string[] = [];
  if (options.sql) {
    const potentialTables = extractPotentialTableNames(options.sql);
    referencedTables = potentialTables.filter((name) => availableTables.includes(name));
  }

  const tablesToDescribe = referencedTables.length > 0 ? referencedTables : availableTables;

  if (tablesToDescribe.length === 0) {
    return {
      summary: null,
      tableNames: availableTables,
      referencedTables,
      warnings,
    };
  }

  const summaries: string[] = [];
  for (const tableName of tablesToDescribe) {
    if (!tableName || !tableName.trim()) {
      continue;
    }
    const formatted = await getFormattedSchemaForTable(supabaseClient, tableName, warnings);
    if (formatted) {
      summaries.push(formatted);
    }
  }

  return {
    summary: summaries.length > 0 ? summaries.join('\n') : null,
    tableNames: availableTables,
    referencedTables,
    warnings,
  };
}
