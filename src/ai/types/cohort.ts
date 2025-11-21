export interface TagDescriptor {
  tagId: string;
  tagName: string;
  tagValues?: string[];
  tagCategoryId?: string;
  tagCategoryName?: string;
}

export interface TagInsightsMetadata {
  tagId: string;
  tagName: string;
  isMultiValue: boolean;
  usageCount: number;
  studentCount: number;
  lastSeen: string | null;
  valueSample: string[];
  valueSampleTruncated: boolean;
  canonicalValueCount: number;
  observedValueCount: number;
  categoryId?: string;
  categoryName?: string;
}

export interface TagInsightsPayload {
  tags: TagDescriptor[];
  metadata: Record<string, TagInsightsMetadata>;
  summary?: string;
  message?: string;
  error?: string;
}

export type NumericComparisonOperator = '>' | '>=' | '<' | '<=' | '=' | '!=';

export interface CohortQueryTagFilter {
  tagId: string;
  tagName: string;
  values?: string[];
  categoryName?: string;
}

export interface CohortQueryTerm {
  termId: string;
  termName?: string;
  abbreviation?: string;
  startDate?: string;
  endDate?: string;
  yearId?: string;
  yearName?: string;
  isCurrentYear?: boolean;
  isCurrentTerm?: boolean;
}

export interface CohortNumericCondition {
  column: string;
  operator: NumericComparisonOperator;
  value: number;
  label?: string;
}

export type CohortMetricType = 'count' | 'average' | 'sum' | 'percentage';

export interface CohortMetricRequest {
  type: CohortMetricType;
  column?: string;
  description?: string;
}

export interface CohortQuerySpec {
  question: string;
  tags: CohortQueryTagFilter[];
  terms?: CohortQueryTerm[];
  numericConditions?: CohortNumericCondition[];
  requiresCurrentEnrollment?: boolean;
  metric?: CohortMetricRequest;
  additionalNotes?: string[];
}
