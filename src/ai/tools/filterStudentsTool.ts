import { tool } from 'ai';
import { z } from 'zod';
import { columns, defaultVisibility } from '@/components/StudentColumnsConfig';

// Converts structured filter/sort requests into a `/students` URL that the router can navigate to.
// The tool infers column capabilities from `StudentColumnsConfig` so the AI agent only needs to
// supply semantic instructions.

type ColumnOperator =
  | 'contains'
  | 'notContains'
  | 'eq'
  | 'notEq'
  | 'gte'
  | 'lte'
  | 'gt'
  | 'lt'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'recent'
  | 'ageGte'
  | 'ageLte'
  | 'ageEq'
  | 'in';

type ColumnValueType = 'string' | 'number' | 'date';

type ColumnAIMetadata = {
  queryKey?: string;
  valueType: ColumnValueType;
  operators: ColumnOperator[];
  sortKey?: string | null;
  synonyms?: string[];
  promptAppend?: string;
  hiddenFromDefaultView?: boolean;
  recentParam?: string;
};

export type StudentFilterColumnInfo = Omit<ColumnAIMetadata, 'queryKey' | 'sortKey'> & {
  accessorKey: string;
  header: string;
  queryKey: string;
  sortKey?: string;
};

type ColumnInfo = StudentFilterColumnInfo;

type ScalarFilterValue = string | number | boolean;
type ListFilterValue = Array<string | number>;
type FilterValue = ScalarFilterValue | ListFilterValue;

type FilterInput = {
  columnKey: string;
  operator: ColumnOperator;
  value?: FilterValue;
};

const SUPPORTED_OPERATORS: ColumnOperator[] = [
  'contains',
  'notContains',
  'eq',
  'notEq',
  'gte',
  'lte',
  'gt',
  'lt',
  'isEmpty',
  'isNotEmpty',
  'recent',
  'ageGte',
  'ageLte',
  'ageEq',
  'in'
];

// Normalize the raw column metadata into a map the tool can use. During this pass we validate
// operators and default any missing query/sort keys to the accessor.
const columnInfos: StudentFilterColumnInfo[] = (() => {
  const infos: StudentFilterColumnInfo[] = [];

  for (const column of columns) {
    const accessorKey = getAccessorKey(column);
    if (!accessorKey) {
      continue;
    }

    const ai = getAIMetadata(column);
    if (!ai) {
      continue;
    }

    const invalidOperator = ai.operators.find((operator) => !SUPPORTED_OPERATORS.includes(operator));
    if (invalidOperator) {
      throw new Error(`Unsupported operator "${invalidOperator}" declared for column "${accessorKey}".`);
    }

    const { queryKey, sortKey, ...rest } = ai;

    const resolvedQueryKey = queryKey ?? accessorKey;
    const resolvedSortKey = sortKey === null ? undefined : sortKey ?? accessorKey;

    infos.push({
      accessorKey,
      header: getHeaderLabel(column) ?? accessorKey,
      queryKey: resolvedQueryKey,
      sortKey: resolvedSortKey,
      ...rest
    });
  }

  if (infos.length === 0) {
    throw new Error('filterStudentsTool: no columns expose AI metadata.');
  }

  return infos;
})();

const columnInfoMap = new Map(columnInfos.map((info) => [info.accessorKey, info]));

const columnKeyList = columnInfos.map((info) => info.accessorKey);

const operatorKeyList = Array.from(
  columnInfos.reduce<Set<ColumnOperator>>((set, info) => {
    info.operators.forEach((operator) => set.add(operator));
    return set;
  }, new Set())
);

const sortableColumns = columnInfos.filter((info) => Boolean(info.sortKey));

// These enums prevent the tool from accepting column/operator combos that are not explicitly
// configured. They are derived rather than hard-coded so new columns automatically opt in.
const columnEnum = z.enum(columnKeyList as [string, ...string[]]);
const operatorEnum = z.enum(operatorKeyList as [ColumnOperator, ...ColumnOperator[]]);
const sortColumnEnum = sortableColumns.length
  ? z.enum(sortableColumns.map((info) => info.accessorKey) as [string, ...string[]])
  : undefined;

const scalarValueSchema = z.union([z.string(), z.number(), z.boolean()]);
const listValueSchema = z.array(z.union([z.string(), z.number()]));

const filterSchema = z.object({
  columnKey: columnEnum,
  operator: operatorEnum,
  value: z.union([scalarValueSchema, listValueSchema]).optional()
});

const sortSchema = sortColumnEnum
  ? z.object({
      columnKey: sortColumnEnum,
      direction: z.enum(['asc', 'desc'])
    })
  : z.undefined();

const visibleColumnEnum = z.enum(
  Array.from(
    new Set([
      ...Object.keys(defaultVisibility),
      ...columns
        .map((column) => getAccessorKey(column))
        .filter((key): key is string => Boolean(key))
    ])
  ) as [string, ...string[]]
);

const toolDescription = buildToolDescription(columnInfos);

const capabilityGuide = columnInfos
  .map((info) => {
    const operatorList = info.operators.join(', ');
    const synonyms = info.synonyms && info.synonyms.length > 0 ? ` Synonyms: ${info.synonyms.join(', ')}.` : '';
    return `- ${info.accessorKey} (${info.valueType}) operators: ${operatorList}.${synonyms}`;
  })
  .join('\n');

export const studentFilterCapabilitiesGuide = capabilityGuide;

export const studentFilterColumnInfos = columnInfos;

export function createFilterStudentsTool() {
  return tool({
    description: toolDescription,
    inputSchema: z.object({
      filters: z.array(filterSchema).optional(),
      sort: sortSchema.optional(),
      visibleColumns: z.array(visibleColumnEnum).optional(),
      activeOnly: z.boolean().optional()
    }),
    execute: async ({ filters = [], sort, visibleColumns, activeOnly }) => {
      // Start with the default view and add any columns referenced by filters/sorts so users see
      // the data that explains the result set the assistant produced.
      const filterStrings: string[] = [];
      const columnsToDisplay = buildInitialColumnSet(visibleColumns);

      for (const filter of filters) {
        const info = columnInfoMap.get(filter.columnKey);
        if (!info) {
          continue;
        }

        const formattedFilters = formatFilter(info, filter);
        formattedFilters.forEach((entry) => filterStrings.push(entry));

        columnsToDisplay.add(info.accessorKey);
      }

      if (sort && sortColumnEnum) {
        const info = columnInfoMap.get(sort.columnKey);
        if (info?.sortKey) {
          columnsToDisplay.add(info.accessorKey);
        }
      }

      // Build the query string components in the format expected by the students table route.
      const queryParts: string[] = [];

      if (filterStrings.length > 0) {
        queryParts.push(`filters=${encodeURIComponent(filterStrings.join(','))}`);
      }

      if (sort && sortColumnEnum) {
        const info = columnInfoMap.get(sort.columnKey);
        const sortKey = info?.sortKey ?? info?.queryKey;
        if (sortKey) {
          queryParts.push(`sort=${sortKey}:${sort.direction}`);
        }
      }

      if (typeof activeOnly === 'boolean') {
        queryParts.push(`activeOnly=${activeOnly}`);
      }

      const columnList = Array.from(columnsToDisplay);
      if (columnList.length > 0) {
        queryParts.push(`columns=${encodeURIComponent(columnList.join(','))}`);
      }

      const url = queryParts.length > 0 ? `/students?${queryParts.join('&')}` : '/students';

      return {
        url,
        filtersApplied: {
          filters,
          sort,
          visibleColumns: columnList,
          activeOnly
        }
      };
    }
  });
}

function getAccessorKey(column: (typeof columns)[number]): string | null {
  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return column.accessorKey;
  }

  if ('id' in column && typeof column.id === 'string') {
    return column.id;
  }

  return null;
}

function getAIMetadata(column: (typeof columns)[number]): ColumnAIMetadata | undefined {
  return (column as { meta?: { ai?: ColumnAIMetadata } }).meta?.ai;
}

function getHeaderLabel(column: (typeof columns)[number]): string | undefined {
  const header = column.header;
  if (typeof header === 'string') {
    return header;
  }

  return undefined;
}

function buildInitialColumnSet(explicitColumns?: string[]) {
  // Respect explicit overrides first; otherwise derive the visible set from the table defaults
  // while hiding any columns that opted out via `hiddenFromDefaultView`.
  const columnSet = new Set<string>();

  if (Array.isArray(explicitColumns) && explicitColumns.length > 0) {
    explicitColumns.forEach((columnKey) => columnSet.add(columnKey));
    return columnSet;
  }

  Object.entries(defaultVisibility).forEach(([columnKey, isVisible]) => {
    if (isVisible) {
      columnSet.add(columnKey);
    }
  });

  columnInfos.forEach((info) => {
    if (info.hiddenFromDefaultView) {
      columnSet.delete(info.accessorKey);
    }
  });

  return columnSet;
}

function formatFilter(info: ColumnInfo, filter: FilterInput): string[] {
  // Dispatch to a specific formatter based on the operator so we can enforce type coercion and
  // query param naming in one place.
  const scalarValue = filter.operator === 'in' ? undefined : assertScalarValue(filter.value, info, filter.operator);

  switch (filter.operator) {
    case 'contains':
      return [buildStringFilter(info.queryKey, 'contains', scalarValue, info.accessorKey)];
    case 'notContains':
      return [buildStringFilter(info.queryKey, 'not_contains', scalarValue, info.accessorKey)];
    case 'eq':
      return [buildEqualityFilter(info, 'eq', scalarValue)];
    case 'notEq':
      return [buildEqualityFilter(info, 'not', scalarValue)];
    case 'gte':
      return [buildComparisonFilter(info, 'gte', scalarValue)];
    case 'lte':
      return [buildComparisonFilter(info, 'lte', scalarValue)];
    case 'gt':
      return [buildComparisonFilter(info, 'gt', scalarValue)];
    case 'lt':
      return [buildComparisonFilter(info, 'lt', scalarValue)];
    case 'isEmpty':
      return [buildFlagFilter(info.queryKey, 'is_empty')];
    case 'isNotEmpty':
      return [buildFlagFilter(info.queryKey, 'is_not_empty')];
    case 'recent':
      return [buildRecentFilter(info, scalarValue)];
    case 'ageGte':
      return [buildAgeBoundaryFilter(info, scalarValue, 'gte')];
    case 'ageLte':
      return [buildAgeBoundaryFilter(info, scalarValue, 'lte')];
    case 'ageEq':
      return buildExactAgeFilters(info, scalarValue);
    case 'in':
      return [buildInFilter(info, filter.value)];
    default:
      throw new Error(`Unsupported operator ${filter.operator} for column ${info.accessorKey}.`);
  }
}

function assertScalarValue(value: FilterValue | undefined, info: ColumnInfo, operator: ColumnOperator): string | number | boolean | undefined {
  if (Array.isArray(value)) {
    throw new Error(`Operator ${operator} on ${info.accessorKey} does not accept multiple values. Use the "in" operator instead.`);
  }
  return value;
}

function buildStringFilter(queryKey: string, operator: 'contains' | 'not_contains', value: string | number | boolean | undefined, columnKey: string) {
  const stringValue = coerceString(value);
  if (!stringValue) {
    throw new Error(`Filter on ${columnKey} requires a non-empty string value.`);
  }

  return `${queryKey}:${operator}:${encodeURIComponent(stringValue)}`;
}

function buildEqualityFilter(info: ColumnInfo, operator: 'eq' | 'not', value: string | number | boolean | undefined) {
  if (info.valueType === 'number') {
    const numericValue = coerceNumber(value);
    return `${info.queryKey}:${operator}:${numericValue}`;
  }

  const stringValue = coerceString(value);
  if (!stringValue) {
    throw new Error(`Filter on ${info.accessorKey} requires a value.`);
  }

  return `${info.queryKey}:${operator}:${encodeURIComponent(stringValue)}`;
}

function buildInFilter(info: ColumnInfo, value: FilterValue | undefined) {
  if (value === undefined) {
    throw new Error(`In operator on ${info.accessorKey} requires at least one value.`);
  }

  const rawTokens: Array<string | number> = [];

  const appendStringTokens = (input: string) => {
    input
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .forEach((part) => rawTokens.push(part));
  };

  const collectToken = (token: string | number | boolean) => {
    if (typeof token === 'string') {
      appendStringTokens(token);
      return;
    }

    if (typeof token === 'number') {
      rawTokens.push(token);
      return;
    }

    rawTokens.push(token ? 'true' : 'false');
  };

  if (Array.isArray(value)) {
    value.forEach((entry) => collectToken(entry));
  } else {
    collectToken(value);
  }

  if (rawTokens.length === 0) {
    throw new Error(`In operator on ${info.accessorKey} requires at least one value.`);
  }

  const normalizedValues = rawTokens.map((token) => {
    if (info.valueType === 'number') {
      const numericValue = coerceNumber(token);
      return String(numericValue);
    }

    const stringValue = typeof token === 'string' ? token : String(token);
    const trimmed = stringValue.trim();
    if (!trimmed) {
      throw new Error(`In operator on ${info.accessorKey} cannot include empty values.`);
    }
    return trimmed;
  });

  const uniqueValues = Array.from(new Set(normalizedValues));

  if (uniqueValues.length === 0) {
    throw new Error(`In operator on ${info.accessorKey} requires at least one value.`);
  }

  return `${info.queryKey}:in:${uniqueValues.join('|')}`;
}

function buildComparisonFilter(info: ColumnInfo, operator: 'gte' | 'lte' | 'gt' | 'lt', value: string | number | boolean | undefined) {
  if (info.valueType === 'number') {
    const numericValue = coerceNumber(value);
    return `${info.queryKey}:${operator}:${numericValue}`;
  }

  if (info.valueType === 'date') {
    const dateValue = coerceDateString(value);
    return `${info.queryKey}:${operator}:${dateValue}`;
  }

  throw new Error(`${operator} is not supported for column ${info.accessorKey}.`);
}

function buildFlagFilter(queryKey: string, operator: 'is_empty' | 'is_not_empty') {
  return `${queryKey}:${operator}:true`;
}

function buildRecentFilter(info: ColumnInfo, value: string | number | boolean | undefined) {
  if (!info.recentParam) {
    throw new Error(`Column ${info.accessorKey} does not support recent filters.`);
  }

  const days = coercePositiveInteger(value);
  return `${info.recentParam}:in:${days}`;
}

function buildAgeBoundaryFilter(info: ColumnInfo, value: string | number | boolean | undefined, comparator: 'gte' | 'lte') {
  if (info.queryKey !== 'date_of_birth') {
    throw new Error(`Age-based filtering is only available for date_of_birth.`);
  }

  const age = coercePositiveInteger(value);
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;

  if (comparator === 'gte') {
    return `date_of_birth:lte:${birthYear}-12-31`;
  }

  return `date_of_birth:gte:${birthYear}-01-01`;
}

function buildExactAgeFilters(info: ColumnInfo, value: string | number | boolean | undefined) {
  if (info.queryKey !== 'date_of_birth') {
    throw new Error('Exact age filtering is only available for date_of_birth.');
  }

  const age = coercePositiveInteger(value);
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  return [
    `date_of_birth:gte:${birthYear}-01-01`,
    `date_of_birth:lte:${birthYear}-12-31`
  ];
}

function coerceString(value: string | number | boolean | undefined): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function coerceNumber(value: string | number | boolean | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  throw new Error('Expected numeric value.');
}

function coerceDateString(value: string | number | boolean | undefined): string {
  if (typeof value !== 'string') {
    throw new Error('Date comparisons require YYYY-MM-DD string values.');
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error('Date values must be formatted as YYYY-MM-DD.');
  }

  return trimmed;
}

function coercePositiveInteger(value: string | number | boolean | undefined): number {
  const numericValue = coerceNumber(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new Error('Value must be a positive integer.');
  }
  return numericValue;
}

function buildToolDescription(infos: ColumnInfo[]): string {
  const columnLines = infos
    .map((info) => {
      const operatorList = info.operators.join(', ');
      const synonyms = info.synonyms && info.synonyms.length > 0 ? ` Synonyms: ${info.synonyms.join(', ')}.` : '';
      const prompt = info.promptAppend ? ` ${info.promptAppend}` : '';
      return `- ${info.accessorKey} (${info.valueType}) operators: ${operatorList}.${synonyms}${prompt}`;
    })
    .join('\n');

  return [
    'Navigates to the students table with filters and sorting applied. Combine every constraint into a single call.',
    'Use the filters array to build per-column conditions. Each filter requires a columnKey, operator, and optional value. Provide multiple entries for range queries by repeating the column with different operators.',
    'For the "in" operator, supply the value as an array of strings/numbers or as a comma-separated string; the tool will normalize these into the pipe-delimited format required by the backend.',
    'Sorting is optional; when used, supply the columnKey and direction (asc|desc).',
    'visibleColumns defaults to the standard layout plus any filtered columns. Override it only when the user explicitly requests a custom column set.',
    'Set activeOnly to false to include inactive students or true when the user demands only active students. Leave undefined for the default (active only).',
    'Per-column capabilities:\n' + columnLines
  ].join('\n\n');
}
