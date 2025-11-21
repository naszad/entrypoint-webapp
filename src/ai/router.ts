/**
 * Hybrid Agent Router
 * -------------------
 * This module orchestrates how incoming chat requests get delegated to our specialist agents.
 *
 * High-level flow:
 * 1. The chat runtime calls `routeAgent` with the latest user message, prior conversation summary,
 *    and the instantiated agent registry (see `src/ai/agents/index.ts`).
 * 2. We combine default guardrails with any runtime directives and serialize the agent routing
 *    profiles exported from `src/ai/agents/index.ts` (these include ideal use cases, avoid rules, and notes).
 * 3. `runRouterModel` uses `generateObject` to prompt the routing LLM. The model receives both the
 *    catalog of agents and the guardrails, and must return a structured decision (agent id, reason,
 *    confidence, optional clarification).
 * 4. `routeAgent` normalizes the response, enforces safety checks (invalid ids, low confidence,
 *    explicit clarification flags), and falls back to the general assistant when necessary.
 * 5. The final `RoutingDecision` is handed back to the runtime, which then executes the selected
 *    agent. If clarification is needed the general assistant will ask the provided follow-up question.
 *
 * Agents themselves are defined in `src/ai/agents/` and aggregated in `src/ai/agents/index.ts`.
 * That directory also exports the `agentRoutingProfiles` consumed here. When adding a new agent,
 * make sure to update both the registry and its routing profile so the LLM understands when to use it.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import type { LanguageModel } from 'ai';
import type { AgentRegistry, AgentRoutingProfile, AgentId } from './agents';

export interface RoutingInput {
  latestUserMessage: string;
  conversationSummary?: string;
  agents: AgentRegistry;
  model: LanguageModel;
  profiles: Record<AgentId, AgentRoutingProfile>;
  directives?: string[];
}

export interface RoutingDecision {
  agentId: AgentId;
  agent: AgentRegistry[AgentId];
  reason: string;
  signals: string[];
  confidence?: number;
  clarifyingQuestion?: string;
}

// Fallback agent remains the general assistant so we always have a safe responder.
const ROUTER_FALLBACK_AGENT_ID: AgentId = 'generalAssistant';
// Confidence scores from the LLM below this threshold trigger clarification instead of hand-offs.
const LOW_CONFIDENCE_THRESHOLD = 0.6;

// Default guardrails layered on top of the agent catalog before we ask the LLM to route.
const DEFAULT_ROUTING_DIRECTIVES: string[] = [
  'Use the agent catalog as the source of truth. Only select an agent when the full request matches its idealFor guidance and does not violate any avoidWhen rules.',
  'If no agent cleanly covers the request, fall back to the general assistant and collect clarification instead of forcing a specialist.',
  'Whenever you mark needsClarification or report low confidence, provide a concise clarifying question for the user.',
  'If the latest user message is a follow-up to the immediately previous analytics response (even via pronouns like "they" or "those students"), keep the conversation with that same specialist, especially the deep analysis orchestrator, unless their avoidWhen rules are triggered.',
  'Route quantitative requests (counts, averages, percentages, “how many” questions) to the deepAnalysis orchestrator unless the counselor explicitly asks to view raw SQL.',
  'When a counselor asks for rankings, top/bottom lists, or "most/least" comparisons tied to supported data (attendance, grades, credits, behavior summaries, etc.), prefer deepAnalysis so it can evaluate the cohort before sharing names.',
  'Reserve the sqlGenerator agent for situations where another agent delegated the SQL workflow or the counselor explicitly requests the query text.'
];

// Expected shape of the LLM classifier response.
const routingSchema = z.object({
  agentId: z.string(),
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  needsClarification: z.boolean().optional(),
  clarificationQuestion: z.string().optional(),
  signals: z.array(z.string()).optional()
});

type RouterLLMResponse = z.infer<typeof routingSchema>;

// Serializes agent metadata and guidance before invoking the routing model.
async function runRouterModel({
  model,
  profiles,
  directives,
  latestUserMessage,
  conversationSummary
}: {
  model: LanguageModel;
  profiles: Record<AgentId, AgentRoutingProfile>;
  directives: string[];
  latestUserMessage: string;
  conversationSummary?: string;
}): Promise<RouterLLMResponse | null> {
  const agentCatalog = Object.values(profiles)
    .map((profile) => {
      const sections = [
        `ID: ${profile.agentId}`,
        `Name: ${profile.displayName}`,
        `Description: ${profile.description}`,
        `Ideal for: ${profile.idealFor.join('; ')}`
      ];
      if (profile.avoidWhen?.length) {
        sections.push(`Avoid when: ${profile.avoidWhen.join('; ')}`);
      }
      if (profile.notes?.length) {
        sections.push(`Notes: ${profile.notes.join('; ')}`);
      }
      if (profile.priority) {
        sections.push(`Priority: ${profile.priority}`);
      }
      return sections.join('\n');
    })
    .join('\n\n');

  const globalDirectives = directives.length
    ? directives.map((directive, index) => `${index + 1}. ${directive}`).join('\n')
    : 'No additional directives.';

  const systemPrompt = `You are the routing coordinator for the EntryPoint SRM assistants.
Choose the single best agent to handle the latest user request. If no agent fully fits, request clarification instead of guessing.`;

  const userPrompt = [
    'Agent Catalog:',
    agentCatalog,
    '',
    'Global Routing Directives:',
    globalDirectives,
    '',
    conversationSummary ? `Recent Conversation Summary:\n${conversationSummary}` : 'No prior context provided.',
    '',
    `Latest User Message:\n${latestUserMessage}`,
    '',
    'Return a JSON object with fields: agentId, reason, confidence (0-1), needsClarification (boolean), clarificationQuestion (string when clarification is needed), signals (array of short diagnostic strings).'
  ].join('\n');

  try {
    const { object } = await generateObject({
      model,
      schema: routingSchema,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0,
      maxRetries: 2
    });

    return (object as RouterLLMResponse | undefined) ?? null;
  } catch (error) {
    console.error('router: LLM routing failed', error);
    return null;
  }
}

export async function routeAgent({
  latestUserMessage,
  conversationSummary,
  agents,
  model,
  profiles,
  directives = []
}: RoutingInput): Promise<RoutingDecision> {
  console.log('==== ROUTER DECISION LOG ====');

  const trimmedMessage = latestUserMessage?.trim?.() ?? '';
  const runtimeDirectives = [...directives];

  // Merge shared guardrails with any ad-hoc directives supplied by the caller.
  const allDirectives = [...DEFAULT_ROUTING_DIRECTIVES, ...runtimeDirectives];
  const fallbackAgent = agents[ROUTER_FALLBACK_AGENT_ID];

  if (!trimmedMessage) {
    // Empty user message usually signals a logging or UI bug—default back safely.
    return {
      agentId: ROUTER_FALLBACK_AGENT_ID,
      agent: fallbackAgent,
      reason: 'No latest user message provided; defaulting to general assistant.',
      signals: ['router:emptyMessage']
    };
  }

  // Ask the routing model to choose a specialist (or request clarification).
  const llmResponse = await runRouterModel({
    model,
    profiles,
    directives: allDirectives,
    latestUserMessage: trimmedMessage,
    conversationSummary
  });

  const signals: string[] = [];

  if (!llmResponse) {
    // If the classifier failed entirely, stay resilient by keeping the user with the fallback agent.
    return {
      agentId: ROUTER_FALLBACK_AGENT_ID,
      agent: fallbackAgent,
      reason: 'Routing model unavailable; falling back to general assistant.',
      signals: ['router:llmUnavailable']
    };
  }

  // Normalize the model response before trusting it against our registry.
  const normalizedAgentId = (llmResponse.agentId?.trim?.() ?? '') as AgentId;
  const agentExists = normalizedAgentId && normalizedAgentId in agents;

  const confidence = typeof llmResponse.confidence === 'number' ? llmResponse.confidence : undefined;
  const needsClarification =
    llmResponse.needsClarification === true || (confidence !== undefined && confidence < LOW_CONFIDENCE_THRESHOLD);

  if (!agentExists) {
    signals.push('router:invalidAgentId');
  }

  if (confidence !== undefined) {
    signals.push(`router:confidence:${confidence.toFixed(2)}`);
  }

  if (llmResponse.signals?.length) {
    signals.push(...llmResponse.signals);
  }

  // Default back to the generalist when the pick is invalid or the model lacks conviction.
  const selectedAgentId = agentExists && !needsClarification ? normalizedAgentId : ROUTER_FALLBACK_AGENT_ID;
  const agent = agents[selectedAgentId];

  let clarifyingQuestion = llmResponse.clarificationQuestion?.trim();
  if (needsClarification && !clarifyingQuestion) {
    clarifyingQuestion = 'Could you clarify what you need so I can route you to the right specialist?';
  }

  if (needsClarification) {
    signals.push('router:clarificationRequested');
  }

  const reason = llmResponse.reason || 'Router fallback triggered; delegating to general assistant.';

  return {
    agentId: selectedAgentId,
    agent,
    reason,
    signals,
    confidence,
    clarifyingQuestion: needsClarification ? clarifyingQuestion : undefined
  };
}
