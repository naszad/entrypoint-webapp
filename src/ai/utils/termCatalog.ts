import type { SupabaseClient } from '@supabase/supabase-js';
import type { CohortQueryTerm } from '../types/cohort';

interface LoadCuratedTermsArgs {
  supabase: SupabaseClient;
  schoolId: string;
  asOf?: Date;
  maxYears?: number;
  expandToAllYears?: boolean;
}

export interface TermCatalogMetadata {
  totalTerms: number;
  curatedCount: number;
  consideredYearIds: string[];
  currentYearId?: string | null;
  asOfIso: string;
}

interface TermRow {
  term_id: string;
  external_name?: string | null;
  abbreviation?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  year_id?: string | null;
  years?: {
    year_id?: string | null;
    name?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    is_current?: boolean | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
}

type TermRecord = CohortQueryTerm & {
  startDateMs: number | null;
  endDateMs: number | null;
};

type YearAggregate = {
  yearId: string | null;
  yearName?: string | null;
  isCurrent?: boolean;
  startYear?: number | null;
  startMs: number | null;
  endMs: number | null;
  terms: TermRecord[];
  yearSortKey?: number | null;
};

function parseDateToMs(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return Date.UTC(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function determineYearSortKey(aggregate: YearAggregate): number | null {
  if (typeof aggregate.startYear === 'number') {
    return aggregate.startYear;
  }

  if (aggregate.startMs !== null) {
    const start = new Date(aggregate.startMs);
    return start.getUTCFullYear();
  }

  return null;
}

function normalizeYearId(value: string | null | undefined): string {
  return value ?? '__unknown__';
}

// Collects a school-scoped term catalog, grouping terms by academic year so analytics prompts can
// reason about current vs prior terms without hauling the entire raw terms table into memory.
export async function loadCuratedTermCatalog({
  supabase,
  schoolId,
  asOf = new Date(),
  maxYears = 2,
  expandToAllYears = false,
}: LoadCuratedTermsArgs): Promise<{ terms: CohortQueryTerm[]; metadata: TermCatalogMetadata }> {
  const asOfIso = asOf.toISOString();

  const { data, error } = await supabase
    .from('terms')
    .select(
      `term_id, external_name, abbreviation, start_date, end_date, year_id, years(year_id, name, start_year, end_year, is_current, start_date, end_date)`
    )
    .eq('school_id', schoolId)
    .order('start_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to load academic terms: ${error.message}`);
  }

  const rows = (data ?? []) as TermRow[];
  const asOfMs = asOf.getTime();

  const aggregates = new Map<string | null, YearAggregate>();
  const allTerms: TermRecord[] = rows.map((row) => {
    const startMs = parseDateToMs(row.start_date);
    const endMs = parseDateToMs(row.end_date);
    const yearId = row.year_id ?? row.years?.year_id ?? null;
    const aggregate = aggregates.get(yearId) ?? {
      yearId,
      yearName: row.years?.name ?? undefined,
      isCurrent: row.years?.is_current ?? undefined,
      startYear: row.years?.start_year ?? undefined,
      startMs: startMs,
      endMs: endMs,
      terms: [],
      yearSortKey: undefined,
    };

    aggregate.yearName = aggregate.yearName ?? (row.years?.name ?? undefined);
    aggregate.isCurrent = aggregate.isCurrent ?? (row.years?.is_current ?? undefined);
    aggregate.startYear = aggregate.startYear ?? (row.years?.start_year ?? undefined);

    if (aggregate.startMs === null || (startMs !== null && startMs < aggregate.startMs)) {
      aggregate.startMs = startMs;
    }

    if (aggregate.endMs === null || (endMs !== null && endMs > aggregate.endMs)) {
      aggregate.endMs = endMs;
    }

    aggregates.set(yearId, aggregate);

    const record: TermRecord = {
      termId: row.term_id,
      termName: row.external_name ?? undefined,
      abbreviation: row.abbreviation ?? undefined,
      startDate: row.start_date ?? undefined,
      endDate: row.end_date ?? undefined,
      yearId: yearId ?? undefined,
      yearName: row.years?.name ?? undefined,
      isCurrentYear: row.years?.is_current ?? aggregate.isCurrent ?? false,
      isCurrentTerm: false,
      startDateMs: startMs,
      endDateMs: endMs,
    };

    aggregate.terms.push(record);
    return record;
  });

  aggregates.forEach((aggregate) => {
    aggregate.yearSortKey = determineYearSortKey(aggregate);
    aggregate.terms.sort((a, b) => {
      if (a.startDateMs === null && b.startDateMs === null) return 0;
      if (a.startDateMs === null) return -1;
      if (b.startDateMs === null) return 1;
      return a.startDateMs - b.startDateMs;
    });
  });

  let currentYearId: string | null | undefined = undefined;
  for (const aggregate of aggregates.values()) {
    if (aggregate.isCurrent) {
      currentYearId = aggregate.yearId;
      break;
    }
  }

  if (!currentYearId) {
    for (const aggregate of aggregates.values()) {
      if (aggregate.startMs !== null && aggregate.endMs !== null) {
        if (aggregate.startMs <= asOfMs && asOfMs <= aggregate.endMs) {
          currentYearId = aggregate.yearId;
          break;
        }
      }
    }
  }

  if (!currentYearId) {
    const sortedAggregates = Array.from(aggregates.values()).sort((a, b) => {
      if (a.startMs === null && b.startMs === null) return 0;
      if (a.startMs === null) return -1;
      if (b.startMs === null) return 1;
      return b.startMs - a.startMs;
    });
    currentYearId = sortedAggregates[0]?.yearId;
  }

  const yearEntries = Array.from(aggregates.values()).sort((a, b) => {
    const aKey = a.yearSortKey ?? (a.startMs !== null ? new Date(a.startMs).getUTCFullYear() : Number.NEGATIVE_INFINITY);
    const bKey = b.yearSortKey ?? (b.startMs !== null ? new Date(b.startMs).getUTCFullYear() : Number.NEGATIVE_INFINITY);
    if (aKey === bKey) {
      return (b.startMs ?? Number.NEGATIVE_INFINITY) - (a.startMs ?? Number.NEGATIVE_INFINITY);
    }
    return bKey - aKey;
  });

  const selectedYearIds: string[] = [];

  if (currentYearId) {
    selectedYearIds.push(normalizeYearId(currentYearId));
  }

  const yearLimit = expandToAllYears ? Number.POSITIVE_INFINITY : Math.max(1, maxYears);

  for (const aggregate of yearEntries) {
    if (selectedYearIds.length >= yearLimit) {
      break;
    }
    const yearId = normalizeYearId(aggregate.yearId);
    if (selectedYearIds.includes(yearId)) {
      continue;
    }
    selectedYearIds.push(yearId);
  }

  const curatedTerms: CohortQueryTerm[] = [];
  const consideredYearIds: string[] = [];

  for (const aggregate of yearEntries) {
    const normalizedYearId = normalizeYearId(aggregate.yearId);
    if (!selectedYearIds.includes(normalizedYearId)) {
      if (expandToAllYears) {
        selectedYearIds.push(normalizedYearId);
      } else {
        continue;
      }
    }

    consideredYearIds.push(normalizedYearId);

    aggregate.terms.forEach((term) => {
      const isCurrentYear = currentYearId !== undefined && currentYearId !== null && term.yearId === currentYearId;
      const isCurrentTerm =
        term.startDateMs !== null && term.endDateMs !== null && term.startDateMs <= asOfMs && asOfMs <= term.endDateMs;

      curatedTerms.push({
        termId: term.termId,
        termName: term.termName,
        abbreviation: term.abbreviation,
        startDate: term.startDate,
        endDate: term.endDate,
        yearId: term.yearId,
        yearName: term.yearName,
        isCurrentYear: isCurrentYear,
        isCurrentTerm,
      });
    });
  }

  const metadata: TermCatalogMetadata = {
    totalTerms: allTerms.length,
    curatedCount: curatedTerms.length,
    consideredYearIds,
    currentYearId,
    asOfIso,
  };

  console.info('[term-catalog]', {
    schoolId,
    totalTerms: metadata.totalTerms,
    curatedCount: metadata.curatedCount,
    consideredYearIds: metadata.consideredYearIds,
    currentYearId: metadata.currentYearId,
    expandToAllYears,
    asOf: metadata.asOfIso,
  });

  return {
    terms: curatedTerms,
    metadata,
  };
}
