import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export interface TemporalContextInput {
  question: string;
  conversationSummary?: string;
  schemaSummary?: string | null;
  availableViews?: string[];
}

export interface TemporalContextDecision {
  includeAcademicTerms: boolean;
  includeAcademicYears: boolean;
  rationale: string;
  confidence: 'low' | 'medium' | 'high';
}

// Give the gate its own model knob so we can tune it independently without touching router config.
const MODEL_ID =
  process.env.AI_MODEL_TEMPORAL_CONTEXT ||
  process.env.AI_MODEL_ROUTER ||
  process.env.AI_MODEL_DEFAULT ||
  'gpt-4o-mini';

const decisionSchema = z.object({
  includeAcademicTerms: z.boolean().default(false),
  includeAcademicYears: z.boolean().default(false),
  rationale: z.string().default('No rationale provided.'),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
});

interface HeuristicSignals {
  mentionsTerms: boolean;
  mentionsSchoolYear: boolean;
  referencesExplicitDates: boolean;
}

// Quick regex heuristics help us short-circuit obvious cases and provide sensible fallbacks if the
// LLM call fails (timeouts, rate limits, etc.).
function detectHeuristics(question: string): HeuristicSignals {
  const lowered = question.toLowerCase();

  const termKeywordPattern = /\b(term|semester|quarter|trimester|grading period|marking period)s?\b/;
  const termCodePattern = /\b(?:s|q|t)[0-9]{1,2}\b/; // captures common SIS codes like S1, Q3, T2
  const seasonPattern = /\b(fall|spring|summer|winter)\b/;
  const mentionsTerms = termKeywordPattern.test(lowered) || termCodePattern.test(lowered) || seasonPattern.test(lowered);

  const yearKeywordPattern = /school year|academic year|this year|current year|last year|previous year|year to date/;
  const yearCodePattern = /\bsy?[0-9]{2}\b|\b20[0-9]{2}\s*[-/]\s*20[0-9]{2}\b/; // SY24, SY2024, 2024-2025, etc.
  const mentionsSchoolYear = yearKeywordPattern.test(lowered) || yearCodePattern.test(lowered);

  const referencesExplicitDates = /\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(lowered);

  return {
    mentionsTerms,
    mentionsSchoolYear,
    referencesExplicitDates,
  };
}

export async function decideTemporalContextNeeds({
  question,
  conversationSummary,
  schemaSummary,
  availableViews,
}: TemporalContextInput): Promise<TemporalContextDecision> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    return {
      includeAcademicTerms: false,
      includeAcademicYears: false,
      rationale: 'No question supplied; defaulting to minimal context.',
      confidence: 'low',
    };
  }

  const heuristics = detectHeuristics(trimmedQuestion);

  // Start from heuristic defaults so we still behave deterministically if the LLM classification
  // short-circuits. The LLM can override these when it has stronger evidence.
  const baseDecision: TemporalContextDecision = {
    includeAcademicTerms: heuristics.mentionsTerms && !heuristics.referencesExplicitDates,
    includeAcademicYears: heuristics.mentionsSchoolYear && !heuristics.referencesExplicitDates,
    rationale: 'Heuristic defaults prior to classification.',
    confidence: 'low',
  };

  const schemaSection = schemaSummary?.trim()
    ? schemaSummary.slice(0, 6000)
    : 'Schema summary unavailable due to RPC failure or cache miss.';

  // The prompt walks the model through explicit guardrails so it favors direct date filters when
  // possible and only falls back to terms/years when the schema truly requires it.
  const promptSections = [
    'Task: Decide whether to provide academic term metadata and/or academic year metadata to the SQL-planning agent. Only include these when the counselor question or the relevant views demand them.',
    'Guidelines:',
    '- Prefer direct date filtering when the question includes explicit dates **and** the relevant views expose exact date columns or helper flags like is_current_year.',
    '- Include academic terms only when the counselor explicitly references terms/semesters/quarters **or** the views needed to answer the question lack direct date columns but require term identifiers.',
    '- Include academic years only when the question references school years and the relevant views lack direct year flags/columns.',
    '- If the counselor mentions a term abbreviation (e.g., S1, Q3, T2) or quarter label, always include academic term metadata so downstream tooling can resolve the correct term_id.',
    '- When unsure, lean toward omitting extra context and explain what additional signal would have justified it.',
    'Provide a short rationale referencing the question and the schema evidence you used.',
    `Counselor question: ${trimmedQuestion}`,
  ];

  if (conversationSummary?.trim()) {
    promptSections.push(`Recent conversation context: ${conversationSummary.trim().slice(0, 1000)}`);
  }

  if (availableViews?.length) {
    promptSections.push(`Available views (truncated list): ${availableViews.slice(0, 20).join(', ')}`);
  }

  promptSections.push('Schema snippet (may be truncated):');
  promptSections.push(schemaSection);

  promptSections.push(
    'Respond in JSON only using the schema { includeAcademicTerms: boolean, includeAcademicYears: boolean, rationale: string, confidence: "low" | "medium" | "high" }.'
  );

  try {
    const { object } = await generateObject({
      model: openai(MODEL_ID),
      schema: decisionSchema,
      system:
        'You are a cautious planner ensuring AI prompts remain minimal. Return JSON only. Do not invent metadata when date columns already satisfy the request.',
      prompt: promptSections.join('\n\n'),
    });

    let includeAcademicTerms = object.includeAcademicTerms;
    const includeAcademicYears = object.includeAcademicYears;
    let rationale = object.rationale;
    let confidence = object.confidence;

    if (heuristics.mentionsTerms && !includeAcademicTerms) {
      includeAcademicTerms = true;
      rationale = `${rationale} Overridden to include academic terms because the question references term codes or quarters detected heuristically.`;
      confidence = confidence === 'high' ? 'medium' : confidence;
    }

    return {
      includeAcademicTerms,
      includeAcademicYears,
      rationale,
      confidence,
    };
  } catch (error) {
    console.warn('temporalContextGate: LLM classification failed, falling back to heuristics.', error);
    return baseDecision;
  }
}
