export type SqlPlan = {
  /** Primary goal the assistant should address with SQL. */
  objective: string;
  /** High-level description of the proposed approach. */
  summary: string;
  /** Optional SQL draft supplied by the planner. Empty when more research is required. */
  sql?: string;
  /** Assumptions that must be confirmed with the counselor before execution. */
  assumptions: string[];
  /** Suggested follow-ups that clarify ambiguous requirements. */
  followUpQuestions: string[];
  /** Flag indicating whether the planner expects tag metadata before writing SQL. */
  requiresTagGuidance?: boolean;
  /** Optional notes about how tag descriptors should be applied (e.g., required tag_ids or values). */
  tagGuidanceNotes?: string[];
};

export type SqlEvaluationSeverity = 'none' | 'low' | 'medium' | 'high';

export interface SqlEvaluationFeedback {
  approved: boolean;
  feedback: string;
  blockingIssues: string[];
  recommendedFix?: string;
  normalizedSql?: string;
  reasoning?: string;
  severity?: SqlEvaluationSeverity;
  iterations?: number;
  notes?: string;
}

export interface SqlExecutionResult {
  rows: unknown[];
  rowCount: number;
  evaluation: SqlEvaluationFeedback;
}
