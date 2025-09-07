/**
 * Types related to chat assistant tools and their invocations
 */
import type { ToolUIPart } from 'ai';

export type FiltersApplied = {
  gradeLevel?: number;
  fullName?: string;
  enrollmentStatus?: 'active' | 'inactive';
  gender?: 'male' | 'female';
  homeroomName?: string;
  graduationYear?: number;
  email?: string;
  ageFilter?: {
    age: number;
    operator: 'eq' | 'gte' | 'lte';
  };
  gpaFilter?: {
    value: number;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  };
  createdAtRecentOnly?: number;
  updatedAtRecentOnly?: number;
};

export type ToolInvocation = {
  toolName: string;
  result: {
    url?: string;
    filtersApplied?: FiltersApplied;
  }
}

/**
 * Type for tool results specifically for filter_students tool
 */
export type FilterStudentsResult = {
  url: string;
  filtersApplied: FiltersApplied;
  description: string;
}

// Input and output types for executeSqlTool
export type ExecuteSqlInput = { sql: string };
export type SqlRowData = Record<string, string | number | boolean | null | Date>;
export type ExecuteSqlOutput = SqlRowData[] | { error: string };

// Input and output types for listTablesTool
export type ListTablesInput = Record<string, never>;
export type ListTablesOutput = string[] | { error: string };

// Input and output types for getTableSchemaTool
export type GetTableSchemaInput = { tableName: string };
export type TableSchema = { column_name: string; data_type: string };
export type GetTableSchemaOutput = TableSchema[] | { error: string };

// Input and output types for filterStudentsTool
export type FilterStudentsInput = {
  gradeLevel?: number;
  fullName?: string;
  enrollmentStatus?: 'active' | 'inactive';
  gender?: 'male' | 'female';
  homeroomName?: string;
  graduationYear?: number;
  email?: string;
  ageFilter?: { age: number; operator: 'eq' | 'gte' | 'lte' };
  gpaFilter?: { value: number; operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' };
  createdAtRecentOnly?: number;
  updatedAtRecentOnly?: number;
};
// Output type already defined as FilterStudentsResult
export type FilterStudentsOutput = FilterStudentsResult;

// Input and output types for getStudentGpaTool
export type GetStudentGpaInput = {
  studentName: string;
  method?: string;
  gradeCodes?: string[];
  creditTypes?: string[];
  yearLabels?: string[];
  gradeLevels?: number[];
};
export type GetStudentGpaOutput = { gpa: number; method: string } | { error: string };

// Define the tools mapping for ToolUIPart
export type ChatTools = {
  executeSql: {
    input: ExecuteSqlInput;
    output: ExecuteSqlOutput;
  };
  listTables: {
    input: ListTablesInput;
    output: ListTablesOutput;
  };
  getTableSchema: {
    input: GetTableSchemaInput;
    output: GetTableSchemaOutput;
  };
  filterStudents: {
    input: FilterStudentsInput;
    output: FilterStudentsOutput;
  };
  getStudentGpa: {
    input: GetStudentGpaInput;
    output: GetStudentGpaOutput;
  };
};

// Specific ToolUIPart types for each tool
export type ExecuteSqlUIPart = ToolUIPart<{ executeSql: ChatTools['executeSql'] }>;
export type ListTablesUIPart = ToolUIPart<{ listTables: ChatTools['listTables'] }>;
export type GetTableSchemaUIPart = ToolUIPart<{ getTableSchema: ChatTools['getTableSchema'] }>;
export type FilterStudentsUIPart = ToolUIPart<{ filterStudents: ChatTools['filterStudents'] }>;
export type GetStudentGpaUIPart = ToolUIPart<{ getStudentGpa: ChatTools['getStudentGpa'] }>;

// Union type for all tool UI parts
export type AllToolUIParts = ExecuteSqlUIPart | ListTablesUIPart | GetTableSchemaUIPart | FilterStudentsUIPart | GetStudentGpaUIPart;