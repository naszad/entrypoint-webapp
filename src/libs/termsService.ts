'use server';

import { createClient } from '@/utils/supabase/supabaseServer';
import { cookies } from 'next/headers';
import { TermRow } from '@/types/Models';

export interface TermSummary {
  termId: string;
  name: string | null;
  abbreviation: string;
  startDate: string;
  endDate: string;
  yearId: string;
  schoolId: string;
  containsDate: boolean;
  durationDays: number | null;
}

export interface FetchTermsForDateParams {
  date?: string;
  schoolId?: string;
}

export interface FetchTermsForDateResult {
  date: string;
  schoolId: string | null;
  matchingTerms: TermSummary[];
  terms: TermSummary[];
}

export async function fetchTermsForDate({
  date,
  schoolId = '',
}: FetchTermsForDateParams): Promise<FetchTermsForDateResult> {
  const targetDateIso = normalizeIsoDate(date);
  const targetUtcTime = dateOnlyToUtcMs(targetDateIso);

  const cookieStore = await cookies();
  const effectiveSchoolId = schoolId ?? cookieStore.get('selectedSchoolId')?.value ?? null;

  if (!effectiveSchoolId) {
    throw new Error('A schoolId is required to fetch academic terms.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .eq('school_id', effectiveSchoolId)
    .not('start_date', 'is', null)
    .not('end_date', 'is', null)
    .order('start_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to load academic terms: ${error.message}`);
  }

  const termRows = (data ?? []) as TermRow[];
  const terms = termRows.map((term) => mapTerm(term, targetUtcTime));
  const matchingTerms = terms.filter((term) => term.containsDate);

  return {
    date: targetDateIso,
    schoolId: effectiveSchoolId,
    matchingTerms,
    terms,
  };
}

function mapTerm(term: TermRow, targetUtcTime: number | null): TermSummary {
  const normalizedStart = normalizeIsoDate(term.start_date);
  const normalizedEnd = normalizeIsoDate(term.end_date);
  const startUtc = dateOnlyToUtcMs(normalizedStart);
  const endUtc = dateOnlyToUtcMs(normalizedEnd);

  const containsDate =
    startUtc !== null &&
    endUtc !== null &&
    targetUtcTime !== null &&
    startUtc <= targetUtcTime &&
    targetUtcTime <= endUtc;

  let durationDays: number | null = null;
  if (startUtc !== null && endUtc !== null) {
    const diffMs = endUtc - startUtc;
    durationDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  return {
    termId: term.term_id,
    name: term.external_name,
    abbreviation: term.abbreviation,
    startDate: normalizedStart,
    endDate: normalizedEnd,
    yearId: term.year_id,
    schoolId: term.school_id,
    containsDate,
    durationDays,
  };
}

function normalizeIsoDate(input?: string | null): string {
  if (!input) {
    return toIsoDateString(new Date());
  }

  const trimmed = input.trim();
  const basicMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (basicMatch) {
    const [, year, month, day] = basicMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toIsoDateString(parsed);
  }

  throw new Error(`Invalid date value: ${input}`);
}

function toIsoDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateOnlyToUtcMs(date: string | null): number | null {
  if (!date) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
}
