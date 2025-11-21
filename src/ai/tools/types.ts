import type { SupabaseClient } from '@supabase/supabase-js';
import type { SqlEvaluationFeedback } from '../types/sql';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface ToolContext {
  supabase: SupabaseClient;
  selectedSchoolId?: string | null;
  selectedCustomerId?: string | null;
  userId: string;
  sqlEvaluationCache?: Map<string, SqlEvaluationFeedback>;
}

export interface ToolExecutionResult<TData = Json> {
  ok: boolean;
  data?: TData;
  message?: string;
  metadata?: Record<string, unknown>;
}
