/**
 * Deep Analysis agent
 * -------------------
 * This orchestrator drives the full counselor analytics workflow. Unlike the specialist SQL agent,
 * it performs deterministic prework—tag discovery, academic-term resolution, schema summarization,
 * SQL planning, evaluation, execution, and final write-up—in one guarded loop. The comments below
 * document each pipeline stage and the state machine we maintain to produce counselor-ready output.
 *
 * High-level flow:
 * 1. Capture the latest counselor utterance plus a short conversation recap for context retention.
 * 2. Load qualitative metadata (tags + values) and conditionally load academic term context.
 * 3. Build a `CohortQuerySpec` describing tags, numeric conditions, term filters, and metric intent.
 * 4. Fetch schema summaries via Supabase RPCs so downstream prompts stay anchored to real columns
 *    instead of hard-coded assumptions.
 * 5. Call the SQL plan tool, then optionally draft SQL via `ensureSqlDraft` if the plan does not
 *    contain executable SQL yet.
 * 6. Evaluate and execute the SQL, short-circuiting with descriptive errors if any gate fails.
 * 7. Compose a concise user-facing narrative capturing counts, plan highlights, and evaluation info.
 *
 * Implementation patterns:
 * - Shared `state` holds the last pipeline output so routing layers can reuse diagnostics.
 * - Every async step catches errors, records them, and exits early with context; the agent never
 *   retries silently.
 * - Prompts favour guidance derived from schema RPCs and tag catalogs to reduce hallucination risk.
 */
import { ToolLoopAgent, tool } from 'ai';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { BASE_AGENT_RULES } from './baseInstructions';
import type { AgentFactoryParams } from './studentLookupAgent';
import { generateSqlPlan } from '../tools/sqlPlanTool';
import { evaluateSqlWithContext } from '../tools/evaluateSqlTool';
import { executeSqlWithContext } from '../tools/executeSqlTool';
import { fetchSchoolTagCatalog } from '../tools/tagCatalog';
import { buildCohortQuerySpec } from '../tools/cohortSpecTool';
import { createGetCurrentDateTool } from '../tools/getCurrentDateTool';
import { buildSchemaContext } from '../schemaSummary';
import { decideTemporalContextNeeds } from '../temporalContextGate';
import { selectRelevantViews, type SelectedView, type ViewSelectionResult } from '../tools/selectRelevantViewsTool';
import { loadCuratedTermCatalog, type TermCatalogMetadata } from '../utils/termCatalog';
import type { TemporalContextDecision } from '../temporalContextGate';
import type {
  CohortMetricRequest,
  CohortMetricType,
  CohortNumericCondition,
  CohortQuerySpec,
  CohortQueryTagFilter,
  CohortQueryTerm,
  TagDescriptor,
  TagInsightsMetadata,
} from '../types/cohort';
import type { SqlEvaluationFeedback, SqlPlan, SqlExecutionResult } from '../types/sql';

interface DeepAnalysisState {
  latestQuestion?: string;
  conversationSummary?: string;
  pipelineOutput?: DeepAnalysisPipelineResult;
}

interface DeepAnalysisPipelineResult {
  ok: boolean;
  message: string;
  spec?: CohortQuerySpec;
  tagSummary?: string;
  plan?: SqlPlan;
  sql?: string;
  evaluation?: SqlEvaluationFeedback;
  execution?: SqlExecutionResult;
  errors?: string[];
  schemaSummary?: string | null;
}

/**
 * Registers the deep-analysis agent with a single tool (`run_deep_analysis`). All substantive work
 * happens inside that tool; the agent loop itself just ensures we run the pipeline exactly once per
 * counselor question and then return the cached message.
 */
export function createDeepAnalysisAgent({ model, context }: AgentFactoryParams) {
  const state: DeepAnalysisState = {};
  const runPipelineTool = createDeepAnalysisPipelineTool({ model, context, state });

  return new ToolLoopAgent({
    id: 'deep_analysis',
    model,
    instructions: [
      BASE_AGENT_RULES,
      'Primary objective: answer mixed qualitative + quantitative counseling questions by running the deterministic deep-analysis pipeline.',
      'Always call run_deep_analysis in your first step. The tool returns a counselor-ready response string plus diagnostics; after calling it, reply with the provided message and do not call additional tools unless the tool explicitly indicates an error requiring clarification.',
      'Use get_current_date when the user asks for data related to "today" or other time-sensitive information.',
    ].join('\n\n'),
    tools: {
      run_deep_analysis: runPipelineTool,
      get_current_date: createGetCurrentDateTool(),
    },
    prepareStep: async ({ messages, steps }) => {
      state.latestQuestion = extractLatestQuestion(messages);
      state.conversationSummary = buildConversationSummary(messages);

      const alreadyRan = steps.some((step) =>
        (step.toolCalls ?? []).some((call) => call.toolName === 'run_deep_analysis')
      );

      if (alreadyRan) {
        return {
          activeTools: ['get_current_date'] as const,
        };
      }

      return {
        activeTools: ['run_deep_analysis', 'get_current_date'] as const,
        toolChoice: { type: 'tool', toolName: 'run_deep_analysis' },
      } as const;
    },
  });
}

interface CreatePipelineToolOptions {
  model: AgentFactoryParams['model'];
  context: AgentFactoryParams['context'];
  state: DeepAnalysisState;
}

/**
 * build the deterministic pipeline tool invoked by the agent loop. Each step records failures and
 * exits early so routing layers receive precise diagnostics instead of partial results.
 */
function createDeepAnalysisPipelineTool({ model, context, state }: CreatePipelineToolOptions) {
  return tool({
    description:
      'Runs the deterministic deep-analysis pipeline: tag discovery, term resolution, cohort spec drafting, SQL planning, evaluation, execution, and response synthesis.',
    inputSchema: z.object({}).default({}),
    execute: async () => {
      if (!state.latestQuestion?.trim()) {
        const errorMessage = 'Unable to run deep analysis: no user question was captured.';
        state.pipelineOutput = {
          ok: false,
          message: errorMessage,
          errors: [errorMessage],
        };
        return state.pipelineOutput;
      }

      const question = state.latestQuestion.trim();
      const conversationSummary = state.conversationSummary?.trim();

      const errors: string[] = [];
      const { selectedSchoolId, selectedCustomerId, supabase } = context;
      let schemaSummary: string | null = null;
      let availableViews: string[] = [];

      if (!selectedSchoolId) {
        const message = 'A school must be selected before running deep analysis.';
        state.pipelineOutput = {
          ok: false,
          message,
          errors: [message],
        };
        return state.pipelineOutput;
      }

      let descriptors: TagDescriptor[] = [];
      let metadata: Record<string, TagInsightsMetadata> = {};
      let tagSummary = '';

      try {
        const catalog = await fetchSchoolTagCatalog({
          supabase,
          selectedSchoolId,
          customerId: selectedCustomerId ?? undefined,
          limit: 120,
          includeValues: true,
        });

        descriptors = catalog.descriptors;
        metadata = catalog.metadataByTagId;
        tagSummary = summarizeTagCatalog(descriptors, metadata);
      } catch (error) {
        const message =
          error instanceof Error ? `Tag catalog lookup failed: ${error.message}` : 'Tag catalog lookup failed.';
        errors.push(message);
        state.pipelineOutput = {
          ok: false,
          message,
          errors,
        };
        return state.pipelineOutput;
      }

      let viewSelection: ViewSelectionResult | undefined;
      try {
        viewSelection = await selectRelevantViews({
          context,
          question,
          conversationSummary,
          maxPrimaryViews: 4,
          allowSchemaInspection: true,
        });
      } catch (error) {
        console.warn('view-selection: unexpected error selecting relevant views', error);
      }

      if (viewSelection) {
        console.info('[view-selection]', {
          question,
          primaryViews: viewSelection.primaryViews.map((view) => view.name),
          fallbackViews: viewSelection.fallbackViews.map((view) => view.name),
          confidence: viewSelection.confidence,
          rationale: viewSelection.rationale,
        });
      }

      const prioritizedViews = viewSelection?.primaryViews.map((view) => view.name) ?? [];

      // Pull schema context only for the shortlisted views so LLM prompts stay focused.
      try {
        const schemaContext = await buildSchemaContext({
          supabase,
          preferredViews: prioritizedViews.length ? prioritizedViews : undefined,
          includeAllViews: false,
          maxColumnsPerView: 60,
        });

        schemaSummary = schemaContext.summaryText;
        if (viewSelection?.primaryViews.length) {
          availableViews = viewSelection.primaryViews.slice(0, 6).map(formatViewForPlanner);
        } else {
          availableViews = schemaContext.summarizedViews.slice(0, 6);
        }
      } catch (error) {
        const message =
          error instanceof Error ? `Schema summary lookup failed: ${error.message}` : 'Schema summary lookup failed.';
        errors.push(message);
      }

      // Ask the temporal context gate (heuristics + LLM) whether we truly need term/year metadata
      // before inflating the prompt. This keeps explicit-date questions from being nudged toward
      // academic periods unnecessarily.
      let temporalDecision: TemporalContextDecision | undefined;
      try {
        temporalDecision = await decideTemporalContextNeeds({
          question,
          conversationSummary,
          schemaSummary,
          availableViews,
        });
      } catch (error) {
        console.warn('temporalContextGate: unexpected error evaluating temporal context needs.', error);
      }

      const includeAcademicTerms = temporalDecision?.includeAcademicTerms ?? true;
      const includeAcademicYears = temporalDecision?.includeAcademicYears ?? false;
      const temporalRationale =
        temporalDecision?.rationale ?? 'Temporal context decision unavailable; defaulting to legacy behaviour.';

      // Emit lightweight diagnostics so we can audit why the gate chose to include or omit
      // temporal metadata when we review logs.
      console.info('[temporal-context]', {
        question,
        includeAcademicTerms,
        includeAcademicYears,
        rationale: temporalRationale,
        confidence: temporalDecision?.confidence ?? 'low',
        schemaSummaryAvailable: Boolean(schemaSummary),
      });

      let termOptions: CohortQueryTerm[] = [];
      let termCatalogMetadata: TermCatalogMetadata | undefined;
      if (includeAcademicTerms) {
        // Only hydrate the term catalog when the gate says the prompt actually needs it.
        try {
          const termLoad = await loadCuratedTermCatalog({
            supabase,
            schoolId: selectedSchoolId,
            expandToAllYears: temporalDecision?.includeAcademicYears ?? false,
          });
          termOptions = termLoad.terms;
          termCatalogMetadata = termLoad.metadata;
        } catch (error) {
          const message =
            error instanceof Error ? `Academic term lookup failed: ${error.message}` : 'Academic term lookup failed.';
          errors.push(message);
        }
      } else {
        // Surface debug breadcrumbs for questions where we intentionally skipped term metadata.
        console.info('[temporal-context] Skipping academic term catalog for question', {
          question,
        });
      }

      let specResult: ReturnType<typeof buildCohortQuerySpec> extends Promise<infer R> ? R : never;
      try {
        specResult = await buildCohortQuerySpec({
          question,
          conversationSummary,
          tagDescriptors: descriptors,
          tagMetadata: metadata,
          termOptions: includeAcademicTerms ? termOptions : undefined,
        });
      } catch (error) {
        const message =
          error instanceof Error ? `Failed to build cohort specification: ${error.message}` : 'Failed to build cohort specification.';
        errors.push(message);
        state.pipelineOutput = {
          ok: false,
          message,
          tagSummary,
          errors,
        };
        return state.pipelineOutput;
      }

      const spec: CohortQuerySpec = {
        question: specResult.question,
        tags: specResult.tags,
        terms: specResult.terms,
        numericConditions: specResult.numericConditions,
        requiresCurrentEnrollment: specResult.requiresCurrentEnrollment ?? true,
        metric: specResult.metric,
        additionalNotes: specResult.additionalNotes,
      };

      let termReconciliation: TermReconciliationResult | undefined;
      if (includeAcademicTerms && Array.isArray(spec.terms) && spec.terms.length && termOptions.length) {
        termReconciliation = reconcileSelectedTerms({
          selectedTerms: spec.terms,
          termOptions,
          question,
        });

        if (termReconciliation.terms.length) {
          spec.terms = termReconciliation.terms;
        }

        if (termReconciliation.notes.length) {
          const mergedNotes = new Set<string>([...(spec.additionalNotes ?? []), ...termReconciliation.notes]);
          spec.additionalNotes = Array.from(mergedNotes);
        }
      }

      if (includeAcademicTerms) {
        console.info('[term-selection]', {
          question,
          temporalConfidence: temporalDecision?.confidence ?? 'unknown',
          temporalRationale: temporalDecision?.rationale,
          selectedTerms: spec.terms?.map((term) => ({
            termId: term.termId,
            termName: term.termName,
            abbreviation: term.abbreviation,
            yearId: term.yearId,
            yearName: term.yearName,
            isCurrentYear: term.isCurrentYear,
            isCurrentTerm: term.isCurrentTerm,
            matchedBy: termReconciliation?.matches.find((match) => match.termId === term.termId)?.matchedBy,
            assumedCurrentYear: termReconciliation?.matches.find((match) => match.termId === term.termId)?.assumedCurrentYear,
          })) ?? [],
          availableTermCount: termOptions.length,
          catalogMetadata: termCatalogMetadata,
          reconciliationNotes: termReconciliation?.notes ?? [],
        });
      }

      const guidance = buildGuidance(spec);
      const planInput = {
        latestUserMessage: question,
        conversationSummary,
        tagDescriptors: spec.tags.map(toTagDescriptorFromFilter),
        tagMetadata: metadata,
        guidance,
        assumptions: spec.additionalNotes,
        schemaSummary,
        availableViews,
      };

      let plan: SqlPlan;
      try {
        const planResult = await generateSqlPlan(planInput);
        plan = planResult.plan;
      } catch (error) {
        const message = error instanceof Error ? `Failed to build SQL plan: ${error.message}` : 'Failed to build SQL plan.';
        errors.push(message);
        state.pipelineOutput = {
          ok: false,
          message,
          spec,
          tagSummary,
          errors,
        };
        return state.pipelineOutput;
      }

      if (plan.requiresTagGuidance) {
        const guidanceNotes = plan.tagGuidanceNotes?.filter((note) => note.trim().length) ?? [];
        const messageLines = [
          'SQL planner requested additional tag guidance before proceeding.',
          guidanceNotes.length ? ['Tag guidance notes:', ...guidanceNotes.map((note) => `- ${note}`)].join('\n') : undefined,
        ].filter(Boolean) as string[];
        const message = messageLines.join('\n');
        errors.push('SQL plan requires explicit tag guidance prior to drafting SQL.');
        state.pipelineOutput = {
          ok: false,
          message,
          spec,
          tagSummary,
          plan,
          errors,
          schemaSummary,
        };
        return state.pipelineOutput;
      }

      const sqlDraft = await ensureSqlDraft({
        model,
        plan,
        spec,
        schemaSummary,
      });

      if (!sqlDraft) {
        const message = 'SQL draft could not be generated from the plan.';
        errors.push(message);
        state.pipelineOutput = {
          ok: false,
          message,
          spec,
          tagSummary,
          plan,
          errors,
        };
        return state.pipelineOutput;
      }

      const evaluationResult = await evaluateSqlWithContext(context, {
        sql: sqlDraft,
        routerContext: question,
      });

      if ('error' in evaluationResult) {
        const message = `SQL evaluation failed: ${evaluationResult.error}`;
        errors.push(message);
        state.pipelineOutput = {
          ok: false,
          message,
          spec,
          tagSummary,
          plan,
          sql: sqlDraft,
          errors,
        };
        return state.pipelineOutput;
      }

      const evaluation = evaluationResult.evaluation;

      if (!evaluation.approved) {
        const message = `SQL evaluation blocked execution: ${evaluation.feedback}`;
        errors.push(message);
        state.pipelineOutput = {
          ok: false,
          message,
          spec,
          tagSummary,
          plan,
          sql: sqlDraft,
          evaluation,
          errors,
        };
        return state.pipelineOutput;
      }

      const executionResult = await executeSqlWithContext(context, {
        sql: sqlDraft,
        routerContext: question,
        skipEvaluation: true,
      });

      if ('error' in executionResult) {
        const message = `SQL execution failed: ${executionResult.error}`;
        errors.push(message);
        state.pipelineOutput = {
          ok: false,
          message,
          spec,
          tagSummary,
          plan,
          sql: sqlDraft,
          evaluation,
          errors,
        };
        return state.pipelineOutput;
      }

      const execution = executionResult;
      const finalMessage = composeFinalMessage({
        question,
        spec,
  tagSummary,
        plan,
        evaluation,
        execution,
      });

      state.pipelineOutput = {
        ok: true,
        message: finalMessage,
        spec,
        tagSummary,
        plan,
        sql: sqlDraft,
        evaluation,
        execution,
        errors,
        schemaSummary,
      };

      return state.pipelineOutput;
    },
  });
}

function toTagDescriptorFromFilter(filter: CohortQueryTagFilter): TagDescriptor {
  return {
    tagId: filter.tagId,
    tagName: filter.tagName,
    tagValues: filter.values,
    tagCategoryName: filter.categoryName,
  };
}

interface EnsureSqlDraftArgs {
  model: AgentFactoryParams['model'];
  plan: SqlPlan;
  spec: CohortQuerySpec;
  schemaSummary: string | null;
}

/**
 * Builds an executable SQL draft when the plan did not already provide one. We seed the prompt with
 * schema context, tag filters, and numeric conditions so the LLM produces deterministic SQL aligned
 * with earlier pipeline decisions.
 */
async function ensureSqlDraft({ model, plan, spec, schemaSummary }: EnsureSqlDraftArgs): Promise<string | null> {
  if (plan.sql?.trim()) {
    return plan.sql.trim();
  }

  const { generateText } = await import('ai');

  const tagLines = spec.tags.length
    ? spec.tags
        .map((tag) => {
          const values = tag.values?.length ? ` values (${tag.values.join(', ')})` : '';
          return `- tag_id ${tag.tagId} (${tag.tagName})${values}`;
        })
        .join('\n')
    : 'No tag filters provided.';

  const numericLines = spec.numericConditions?.length
    ? spec.numericConditions
        .map((condition) => `- ${condition.column} ${condition.operator} ${condition.value}`)
        .join('\n')
    : 'No numeric conditions specified.';

  const promptSegments = [
    'Draft a SQL SELECT statement for the EntryPoint SRM analytics views that satisfies the cohort specification. Output only the SQL without commentary or trailing semicolons.',
    `Plan summary: ${plan.summary}`,
    schemaSummary ? `Schema context:
${schemaSummary}` : undefined,
    plan.tagGuidanceNotes?.length
      ? `Planner tag guidance:
- ${plan.tagGuidanceNotes.join('\n- ')}`
      : undefined,
    spec.tags.length
      ? 'Apply tag filters by joining views.student_tags (alias as needed) and restricting by tag_id and tag values when provided.'
      : undefined,
    spec.metric?.type === 'count'
      ? 'When counting students after joins, alias the primary student identifier and use COUNT(DISTINCT that_identifier) AS student_count to avoid double counting.'
      : undefined,
    'Tag filters:',
    tagLines,
    'Numeric conditions:',
    numericLines,
    spec.requiresCurrentEnrollment === false
      ? 'The counselor allows non-current students.'
      : 'Restrict the cohort to currently enrolled students.',
    spec.terms?.length
      ? `Limit records to the academic term(s): ${spec.terms
          .map((term) => {
            const label = term.termName ?? 'unnamed';
            const yearDetails = term.yearName ? ` · ${term.yearName}` : term.yearId ? ` · ${term.yearId}` : '';
            return `${term.termId} (${label}${yearDetails})`;
          })
          .join(', ')}`
      : undefined,
    spec.terms?.length
      ? 'Term abbreviations repeat each school year; filter by term_id (and year_id when necessary) instead of relying on term_abbreviation.'
      : undefined,
    plan.followUpQuestions?.length
      ? `If any assumptions remain, address them directly: ${plan.followUpQuestions.join('; ')}`
      : undefined,
    'Use only the curated views referenced in the schema context and produce a single SELECT statement without CTEs.',
  ].filter(Boolean);

  const prompt = promptSegments.join('\n\n');

  const result = await generateText({
    model,
    prompt,
  });

  const sql = result.text?.trim();
  if (sql && sql.toLowerCase().startsWith('select')) {
    return sql.replace(/;\s*$/u, '');
  }

  return null;
}

interface FinalMessageArgs {
  question: string;
  spec: CohortQuerySpec;
  tagSummary?: string;
  plan: SqlPlan;
  evaluation: SqlEvaluationFeedback;
  execution: SqlExecutionResult;
}

function composeFinalMessage({ question, spec, tagSummary, plan, evaluation, execution }: FinalMessageArgs): string {
  const rows = Array.isArray(execution.rows) ? execution.rows : [];
  const rowCount = Number.isFinite(execution.rowCount) ? execution.rowCount : rows.length;
  const metricType = spec.metric?.type ?? 'count';
  const metricLabel = spec.metric ? spec.metric.description?.trim() || describeMetric(spec.metric) : undefined;

  const highlights: string[] = [];

  if (spec.metric) {
    const metricValue = determineMetricValue(spec.metric, execution);
    const label = capitalize(metricLabel ?? describeMetric(spec.metric));
    highlights.push(
      metricValue !== null
        ? `${label}: ${formatMetricValue(metricValue, metricType)}`
        : `${label}: not present in the first result row.`
    );
  }

  if (Number.isFinite(rowCount)) {
    highlights.push(`Rows returned: ${rowCount.toLocaleString('en-US')}`);
  }

  if (spec.tags.length) {
    const tagSummaries = spec.tags
      .map((tag) => {
        const valueClause = tag.values?.length ? ` (${tag.values.slice(0, 5).join(', ')})` : '';
        return `${tag.tagName}${valueClause}`;
      })
      .join('; ');
    highlights.push(`Tag filters: ${tagSummaries}`);
  }

  if (spec.numericConditions?.length) {
    highlights.push(`Numeric constraints: ${spec.numericConditions.map(formatCondition).join('; ')}`);
  }

  if (spec.terms?.length) {
    const termSummary = spec.terms
      .map((term) => term.termName ?? term.abbreviation ?? term.termId)
      .join(', ');
    highlights.push(`Temporal scope: ${termSummary}`);
  }

  if (spec.requiresCurrentEnrollment === false) {
    highlights.push('Enrollment scope: includes students beyond current enrollment.');
  }

  if (rows.length) {
    highlights.push(`Sample row: ${formatRowPreview(rows[0])}`);
  }

  const planLine = `Plan: ${plan.summary}`;
  const evaluationLine = evaluation.approved
    ? 'Evaluation: Approved with no blocking issues.'
    : `Evaluation: ${evaluation.feedback}`;
  const executionLine = 'Execution: query completed successfully via execute_safe_select.';

  const notes: string[] = [];
  if (tagSummary) {
    notes.push(`Tag insight: ${tagSummary}`);
  }
  if (spec.additionalNotes?.length) {
    notes.push(...spec.additionalNotes.map((note) => `Note: ${note}`));
  }
  if (plan.tagGuidanceNotes?.length) {
    notes.push(...plan.tagGuidanceNotes.map((note) => `Tag guidance note: ${note}`));
  }

  return [
    planLine,
    evaluationLine,
    executionLine,
    highlights.length ? ['Highlights:', ...highlights.map((entry) => `- ${entry}`)].join('\n') : undefined,
    notes.length ? ['', ...notes].join('\n') : undefined,
    '',
    `Counselor question: ${question}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function formatCondition(condition: CohortNumericCondition): string {
  const label = condition.label ?? condition.column;
  return `${label} ${condition.operator} ${condition.value}`;
}

function determineMetricValue(metric: CohortMetricRequest | undefined, execution: SqlExecutionResult): number | null {
  if (!metric) {
    return null;
  }

  const rows = Array.isArray(execution.rows) ? execution.rows : [];
  if (!rows.length) {
    return null;
  }

  const candidateKeys = buildMetricCandidateKeys(metric);
  return extractNumericValueFromRow(rows[0], candidateKeys, { allowFallback: true });
}

function buildMetricCandidateKeys(metric: CohortMetricRequest): string[] {
  const candidates = new Set<string>();

  const column = metric.column?.trim();
  if (column) {
    candidates.add(column);
    const tail = column.split('.').pop();
    if (tail && tail !== column) {
      candidates.add(tail);
    }
    candidates.add(`${column}_value`);
    if (tail) {
      candidates.add(`${tail}_value`);
    }
  }

  switch (metric.type) {
    case 'average':
      candidates.add('average');
      candidates.add('avg');
      candidates.add('mean');
      break;
    case 'sum':
      candidates.add('sum');
      candidates.add('total');
      candidates.add('total_value');
      candidates.add('sum_value');
      break;
    case 'percentage':
      candidates.add('percentage');
      candidates.add('percent');
      candidates.add('pct');
      candidates.add('ratio');
      break;
    case 'count':
      candidates.add('count');
      candidates.add('student_count');
      break;
    default:
      break;
  }

  candidates.add('metric_value');
  candidates.add('value');
  candidates.add('result');

  return Array.from(candidates);
}

interface ExtractNumericOptions {
  allowFallback?: boolean;
}

function extractNumericValueFromRow(row: unknown, candidateKeys: string[] = [], options: ExtractNumericOptions = {}): number | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const record = row as Record<string, unknown>;
  const normalizedCandidates = candidateKeys
    .map((key) => key?.trim()?.toLowerCase())
    .filter((key): key is string => Boolean(key));
  const candidateSet = new Set(normalizedCandidates);

  for (const key of candidateKeys) {
    if (!key) {
      continue;
    }
    const parsed = parseNumericValue(record[key]);
    if (parsed !== null) {
      return parsed;
    }
  }

  if (candidateSet.size) {
    for (const [key, value] of Object.entries(record)) {
      if (candidateSet.has(key.toLowerCase())) {
        const parsed = parseNumericValue(value);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
  }

  if (options.allowFallback !== false) {
    for (const value of Object.values(record)) {
      const parsed = parseNumericValue(value);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return null;
}

function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }

  return null;
}

function formatMetricValue(value: number | null, type: CohortMetricType): string {
  if (value === null || Number.isNaN(value)) {
    return 'unknown';
  }

  if (type === 'percentage') {
    const normalized = Math.abs(value) <= 1 ? value * 100 : value;
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${formatter.format(normalized)}%`;
  }

  const isWholeNumber = Number.isInteger(value);
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isWholeNumber ? 0 : Math.abs(value) < 1 ? 2 : 1,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRowPreview(row: unknown): string {
  if (!row || typeof row !== 'object') {
    return 'unavailable';
  }

  const entries = Object.entries(row as Record<string, unknown>);
  if (!entries.length) {
    return 'empty row';
  }

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}=${formatPreviewValue(value)}`)
    .join(', ');
}

function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : 'NaN';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (Array.isArray(value)) {
    return `[${value.slice(0, 3).map(formatPreviewValue).join(', ')}${value.length > 3 ? ', …' : ''}]`;
  }
  return JSON.stringify(value);
}

/**
 * Converts the structured cohort spec into natural-language guardrails for the SQL planner. This
 * keeps the planner prompt terse while still reminding it about enrollment, term, tag, and numeric
 * expectations derived from earlier pipeline steps.
 */
function buildGuidance(spec: CohortQuerySpec): string[] {
  const guidance: string[] = [];

  guidance.push('Use only the curated analytics views surfaced in the schema context.');

  if (spec.requiresCurrentEnrollment !== false) {
    guidance.push('Filter to currently enrolled students only.');
  }

  if (spec.terms?.length) {
    guidance.push(
      `Limit records to the academic term(s): ${spec.terms
        .map((term) => `${term.termId}${term.termName ? ` (${term.termName})` : ''}`)
        .join(', ')}`
    );
    guidance.push(
      `Term abbreviations repeat each school year; rely on term_id values (${spec.terms
        .map((term) => term.termId)
        .join(', ')}) and include year_id constraints when touching term tables. Do not filter solely by term_abbreviation.`
    );
    const termYearSummaries = spec.terms
      .map((term) => {
        if (!term.yearName && !term.yearId) {
          return undefined;
        }
        const label = term.termName ?? term.abbreviation ?? term.termId;
        const yearLabel = term.yearName ?? term.yearId;
        return `${label} belongs to ${yearLabel}`;
      })
      .filter((value): value is string => Boolean(value));

    if (termYearSummaries.length) {
      guidance.push(...termYearSummaries);
    }
  }

  if (spec.metric) {
    guidance.push(`Primary metric: ${describeMetric(spec.metric)}.`);
    if (spec.metric.type === 'count') {
      guidance.push('Alias aggregate counts as student_count.');
    }
  }

  if (spec.tags.length) {
    const tagIds = spec.tags.map((tag) => `'${escapeSqlLiteral(tag.tagId)}'`).join(', ');
    guidance.push(`Join views.student_tags (alias as needed) and filter tag_id IN (${tagIds}).`);

    const tagValueFilters = spec.tags
      .filter((tag) => tag.values?.length)
      .map((tag) => {
        const values = tag.values?.map((value) => `'${escapeSqlLiteral(value)}'`).join(', ');
        return values ? `For tag ${tag.tagName}, restrict the tag value column to (${values}).` : '';
      })
      .filter(Boolean) as string[];

    guidance.push(...tagValueFilters);
    guidance.push('Use COUNT(DISTINCT the student identifier column) as student_count when aggregating after joining tags to avoid double counting.');
  }

  if (spec.numericConditions?.length) {
    guidance.push(
      ...spec.numericConditions.map((condition) =>
        `Numeric condition: ${condition.column} ${condition.operator} ${condition.value}`
      )
    );
  }

  return guidance;
}

type TermMatchOrigin = 'term_id' | 'abbreviation' | 'term_name' | 'unmatched';

interface TermReconciliationMatch {
  termId: string;
  matchedBy: TermMatchOrigin;
  assumedCurrentYear?: boolean;
}

interface TermReconciliationResult {
  terms: CohortQueryTerm[];
  notes: string[];
  matches: TermReconciliationMatch[];
}

interface ReconcileSelectedTermsArgs {
  selectedTerms: CohortQueryTerm[];
  termOptions: CohortQueryTerm[];
  question: string;
}

interface TermCandidateIndexes {
  byId: Map<string, CohortQueryTerm>;
  byAbbreviation: Map<string, CohortQueryTerm[]>;
  byName: Map<string, CohortQueryTerm[]>;
}

interface CandidateEvaluation {
  term: CohortQueryTerm;
  matchedBy: TermMatchOrigin;
  score: number;
}

function reconcileSelectedTerms({ selectedTerms, termOptions, question }: ReconcileSelectedTermsArgs): TermReconciliationResult {
  if (!selectedTerms.length || !termOptions.length) {
    return {
      terms: selectedTerms,
      notes: [],
      matches: [],
    };
  }

  const normalizedQuestion = question.toLowerCase();
  const indexes = buildTermIndexes(termOptions);
  const resolvedTerms: CohortQueryTerm[] = [];
  const notes = new Set<string>();
  const matches: TermReconciliationMatch[] = [];
  const seenTermIds = new Set<string>();

  selectedTerms.forEach((rawTerm) => {
    const { candidate, matchedBy, assumedCurrentYear } = findBestTermCandidate({
      term: rawTerm,
      indexes,
      normalizedQuestion,
    });

    if (candidate && !seenTermIds.has(candidate.termId)) {
      resolvedTerms.push({ ...candidate });
      seenTermIds.add(candidate.termId);
      matches.push({
        termId: candidate.termId,
        matchedBy,
        assumedCurrentYear: assumedCurrentYear || undefined,
      });

      if (assumedCurrentYear) {
        const label = candidate.termName ?? candidate.abbreviation ?? candidate.termId;
        const yearLabel = candidate.yearName ?? candidate.yearId ?? 'current school year';
        notes.add(`Interpreted ${label} as the current school year (${yearLabel}) because no year was provided.`);
      }
    } else if (!candidate && rawTerm.termId && !seenTermIds.has(rawTerm.termId)) {
      resolvedTerms.push({ ...rawTerm });
      seenTermIds.add(rawTerm.termId);
      matches.push({
        termId: rawTerm.termId,
        matchedBy: 'unmatched',
      });
    }
  });

  return {
    terms: resolvedTerms,
    notes: Array.from(notes),
    matches,
  };
}

function buildTermIndexes(termOptions: CohortQueryTerm[]): TermCandidateIndexes {
  const byId = new Map<string, CohortQueryTerm>();
  const byAbbreviation = new Map<string, CohortQueryTerm[]>();
  const byName = new Map<string, CohortQueryTerm[]>();

  termOptions.forEach((term) => {
    byId.set(term.termId, term);

    const abbreviationKey = normalizeText(term.abbreviation);
    if (abbreviationKey) {
      const entries = byAbbreviation.get(abbreviationKey) ?? [];
      entries.push(term);
      byAbbreviation.set(abbreviationKey, entries);
    }

    const nameKey = normalizeText(term.termName);
    if (nameKey) {
      const entries = byName.get(nameKey) ?? [];
      entries.push(term);
      byName.set(nameKey, entries);
    }
  });

  return { byId, byAbbreviation, byName };
}

function findBestTermCandidate({
  term,
  indexes,
  normalizedQuestion,
}: {
  term: CohortQueryTerm;
  indexes: TermCandidateIndexes;
  normalizedQuestion: string;
}): { candidate?: CohortQueryTerm; matchedBy: TermMatchOrigin; assumedCurrentYear: boolean } {
  const candidates: CandidateEvaluation[] = [];
  const normalizedTermId = normalizeText(term.termId);

  if (term.termId && indexes.byId.has(term.termId)) {
    const candidate = indexes.byId.get(term.termId)!;
    candidates.push({
      term: candidate,
      matchedBy: 'term_id',
      score: computeCandidateScore({
        reference: term,
        candidate,
        matchedBy: 'term_id',
        normalizedQuestion,
      }),
    });
  }

  const abbreviationKeys = new Set<string>();
  const abbreviationFromId = normalizedTermId ?? normalizeText(term.abbreviation);
  if (abbreviationFromId) {
    abbreviationKeys.add(abbreviationFromId);
  }
  const explicitAbbreviation = normalizeText(term.abbreviation);
  if (explicitAbbreviation) {
    abbreviationKeys.add(explicitAbbreviation);
  }

  abbreviationKeys.forEach((key) => {
    const matchesByAbbreviation = indexes.byAbbreviation.get(key) ?? [];
    matchesByAbbreviation.forEach((candidate) => {
      candidates.push({
        term: candidate,
        matchedBy: 'abbreviation',
        score: computeCandidateScore({
          reference: term,
          candidate,
          matchedBy: 'abbreviation',
          normalizedQuestion,
        }),
      });
    });
  });

  const nameKey = normalizeText(term.termName);
  if (nameKey) {
    const matchesByName = indexes.byName.get(nameKey) ?? [];
    matchesByName.forEach((candidate) => {
      candidates.push({
        term: candidate,
        matchedBy: 'term_name',
        score: computeCandidateScore({
          reference: term,
          candidate,
          matchedBy: 'term_name',
          normalizedQuestion,
        }),
      });
    });
  }

  if (!candidates.length) {
    return { matchedBy: 'unmatched', assumedCurrentYear: false };
  }

  candidates.sort((a, b) => b.score - a.score);

  const topCandidate = candidates[0];
  const alternativeCandidates = candidates.slice(1);
  const assumedCurrentYear = Boolean(
    topCandidate.term.isCurrentYear &&
      !term.yearId &&
      !term.yearName &&
      !questionMentionsYear(normalizedQuestion, topCandidate.term) &&
      alternativeCandidates.some((entry) => entry.term.termId !== topCandidate.term.termId)
  );

  return {
    candidate: topCandidate.term,
    matchedBy: topCandidate.matchedBy,
    assumedCurrentYear,
  };
}

function computeCandidateScore({
  reference,
  candidate,
  matchedBy,
  normalizedQuestion,
}: {
  reference: CohortQueryTerm;
  candidate: CohortQueryTerm;
  matchedBy: TermMatchOrigin;
  normalizedQuestion: string;
}): number {
  let score = 0;

  if (matchedBy === 'term_id') {
    score += 100;
  } else if (matchedBy === 'abbreviation') {
    score += 60;
  } else if (matchedBy === 'term_name') {
    score += 50;
  }

  if (reference.termId && candidate.termId === reference.termId) {
    score += 25;
  }

  const referenceAbbreviation = normalizeText(reference.abbreviation);
  const candidateAbbreviation = normalizeText(candidate.abbreviation);
  if (referenceAbbreviation && candidateAbbreviation && referenceAbbreviation === candidateAbbreviation) {
    score += 30;
  }

  const referenceName = normalizeText(reference.termName);
  const candidateName = normalizeText(candidate.termName);
  if (referenceName && candidateName && referenceName === candidateName) {
    score += 30;
  }

  if (reference.yearId && candidate.yearId && reference.yearId === candidate.yearId) {
    score += 40;
  }

  const referenceYearName = normalizeText(reference.yearName);
  const candidateYearName = normalizeText(candidate.yearName);
  if (referenceYearName && candidateYearName && referenceYearName === candidateYearName) {
    score += 35;
  }

  if (candidate.isCurrentYear) {
    score += 20;
  }

  if (candidate.isCurrentTerm) {
    score += 5;
  }

  if (questionMentionsYear(normalizedQuestion, candidate)) {
    score += 25;
  }

  return score;
}

function normalizeText(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : undefined;
}

function questionMentionsYear(normalizedQuestion: string, term: CohortQueryTerm): boolean {
  if (!normalizedQuestion) {
    return false;
  }

  if (term.yearName) {
    const yearName = term.yearName.toLowerCase();
    if (normalizedQuestion.includes(yearName)) {
      return true;
    }
    const yearFragments = term.yearName.match(/\d{4}/g);
    if (yearFragments?.some((fragment) => normalizedQuestion.includes(fragment))) {
      return true;
    }
  }

  if (term.yearId && normalizedQuestion.includes(term.yearId.toLowerCase())) {
    return true;
  }

  return false;
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function summarizeTagCatalog(
  descriptors: TagDescriptor[],
  metadata: Record<string, TagInsightsMetadata>,
  limit = 5,
): string {
  if (!descriptors.length) {
    return 'No tag descriptors were available for the selected school.';
  }

  const highlights = descriptors.slice(0, limit).map((descriptor) => {
    const meta = metadata[descriptor.tagId];
    const usage = typeof meta?.studentCount === 'number' ? `${meta.studentCount} students` : 'usage unknown';
    const category = meta?.categoryName ? ` | category: ${meta.categoryName}` : '';
    return `${descriptor.tagName} (${usage})${category}`;
  });

  if (descriptors.length > limit) {
    const remaining = descriptors.length - limit;
    highlights.push(`…plus ${remaining} more tag${remaining === 1 ? '' : 's'}.`);
  }

  return `Tag catalog sampled: ${highlights.join('; ')}`;
}

function formatViewForPlanner(view: SelectedView): string {
  if (view.comment && view.comment.trim().length) {
    return `${view.name} — ${view.comment.trim()}`;
  }
  return view.name;
}

function describeMetric(metric: CohortMetricRequest): string {
  const base = metric.type;
  if (metric.column) {
    return `${base} of ${metric.column}`;
  }
  return base;
}

function extractLatestQuestion(messages: ModelMessage[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'user') {
      const text = extractText(message);
      if (text) {
        return text;
      }
    }
  }
  return undefined;
}

function buildConversationSummary(messages: ModelMessage[], limit = 6): string {
  if (!messages.length) {
    return '';
  }

  const startIndex = Math.max(messages.length - limit, 0);
  return messages
    .slice(startIndex)
    .map((message) => {
      const role = message.role?.toUpperCase?.() ?? String(message.role ?? 'UNKNOWN').toUpperCase();
      const text = extractText(message);
      if (!text.trim()) {
        return '';
      }
      return `${role}: ${text.trim()}`;
    })
    .filter(Boolean)
    .join('\n');
}

function extractText(message: ModelMessage): string {
  const { content } = message;
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
          return ((part as { text?: string }).text ?? '').trim();
        }

        return '';
      })
      .join(' ')
      .trim();
  }

  return '';
}
