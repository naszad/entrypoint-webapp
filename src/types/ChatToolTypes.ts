/**
 * Types related to chat assistant tools and their invocations
 */
import type { ToolUIPart } from 'ai';

export type StudentsFiltersApplied = {
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

export type GradesFiltersApplied = {
  fullName?: string;
  course_localCourseCode?: string;
  course_name?: string;
  gradeLetter?: string;
  gradePercentage?: {
    percentage: number;
    operator: 'eq' | 'gte' | 'lte';
  };
  gradeCode?: string;
  credit_type?: string;
  updatedAfter?: string;
  updatedBefore?: string;
};

export type ToolInvocation = {
  toolName: string;
  result: {
    url?: string;
    filtersApplied?: StudentsFiltersApplied | GradesFiltersApplied;
  }
}

/**
 * Type for tool results specifically for filter tools
 */
export type FilterResult = {
  url: string;
  filtersApplied: StudentsFiltersApplied | GradesFiltersApplied;
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

// Input and output types for identifyStudentTool
export type IdentifyStudentInput = { studentName: string; };
export type IdentifyStudentOutput = 
  | { studentId: string; fullName: string; }
  | { noMatchFound: string }
  | { potentialMatches: { studentId: string; fullName: string; gradeLevel: number; }[] };

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
export type FilterStudentsOutput = FilterResult;

// Input and output types for filterGradesTool
export type FilterGradesInput = {
  fullName?: string;
  course_localCourseCode?: string;
  course_name?: string;
  gradeLetter?: string;
  gradePercentage?: { percentage: number; operator: 'eq' | 'gte' | 'lte' };
  gradeCode?: string;
  credit_type?: string;
  updatedAfter?: string;
  updatedBefore?: string;
};
export type FilterGradesOutput = FilterResult;

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
  filterGrades: {
    input: FilterGradesInput;
    output: FilterGradesOutput;
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
export type FilterGradesUIPart = ToolUIPart<{ filterGrades: ChatTools['filterGrades'] }>;
export type GetStudentGpaUIPart = ToolUIPart<{ getStudentGpa: ChatTools['getStudentGpa'] }>;

// Union type for all tool UI parts
export type AllToolUIParts = ExecuteSqlUIPart | ListTablesUIPart | GetTableSchemaUIPart | FilterStudentsUIPart | FilterGradesUIPart | GetStudentGpaUIPart;