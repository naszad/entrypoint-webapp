/**
 * Filter Grades Tool
 * Navigates to filtered grades table view based on natural language queries
 */

import { tool } from 'ai';
import { z } from 'zod/v3';
import { ChatTool } from './types';
import { gradeColumnAccessorKeys } from '@/components/gradeColumnsConfig';

export const filterGradesTool: ChatTool = {
  metadata: {
    name: 'filter_grades',
    category: 'navigation',
    description: 'Applies filters and sorting to the grades data table and navigates the user to the filtered view.',
    systemMessageRules: [
      'Use filter_grades ONLY when the user wants to view, show, find, or display a list/table of grades',
      'This tool is for navigation, not for answering specific questions about individual grades',
      'When course or subject name is mentioned, use course_name parameter',
      'For sorting, use sortBy and sortDirection with fields: full_name, course_name, grade_letter, grade_percentage, grade_code, updated_at, local_course_code',
      'When expressing grade percentage ranges, provide multiple filters (use gte and lte operators) via gradePercentFilters',
      `Any time the user supplies multiple explicit values for a supported column (e.g. ${gradeColumnAccessorKeys.join(", ")}, etc.) (comma-separated, “and”, etc.), always aggregate them into one IN-list filter: add the field to multiValueFilters and never create separate eq filters for each value.Deduplicate any repeated values.`
    ]
  },
  definition: tool({
    description: `Applies filters and sorting to the grades data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of grades**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

**Correct Usage Examples**:
- "Show me grades below 90%", "Show me all A grades", "Find grades for Math courses", "Display grades for John Smith", "Show me Algebra grades sorted by percentage descending", "Find Math grades and sort by student name ascending", "Show me grades in grades in English, Math, and Science" (use multiValueFilters), "Show me all cources with grades in A, B, and C" (use multiValueFilters), "Show me all courses with grades in A, B, and C" (use multiValueFilters)
**Incorrect Usage**:
- Do not use this for questions asking for a specific fact, like "What grade did Jane Doe get in Math?" or "How many students got A's?". For those, you must query the database directly.
- When course or subject name is mentioned, use course_name for example show me grades in english or show me grades in math courses

**Sorting Instructions:**
- When user asks to sort by a field, use sortBy and sortDirection parameters
- Sortable fields: full_name, course_name, grade_letter, grade_percentage, grade_code, updated_at, local_course_code (course number, course code)
- Direction: "asc" for ascending (A-Z, low to high), "desc" for descending (Z-A, high to low)`,
    inputSchema: z.object({
      columns: z.array(z.enum(gradeColumnAccessorKeys)).optional().describe('Columns to display in the grades table. Include all fields relevant to the user query.'),
      full_name: z.string().optional().describe('Student name or part of name to search for'),
      local_course_code: z.string().optional().describe('Course code or part of course code to search for'),
      credit_type: z.string().optional().describe('Credit type (e.g., Math, Science, English, History, Arts, etc.)'),
      course_name: z.string().optional().describe('Course name or part of course name to search for'),
      grade_letter: z.string().optional().describe('Grade letter (e.g., A, B, C, D, F)'),
      grade_percent: z.object({
        percentage: z.number().describe('The grade percentage to filter by'),
        operator: z.enum(['eq', 'gte', 'lte']).default('eq').describe('The comparison operator for the grade percentage filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to)')
      }).optional().describe('Filter grades by percentage. For example, "grades above 85%" or "90% grades".'),
      gradePercentFilters: z.array(z.object({
        percentage: z.number().describe('The grade percentage to filter by'),
        operator: z.enum(['eq', 'gte', 'lte']).describe('Comparison operator for the grade percentage filter')
      })).max(5).optional().describe('Use multiple grade percentage filters to represent ranges (e.g., between 70 and 80 uses gte 70 and lte 80).'),
      grade_code: z.string().optional().describe('Grade code (e.g., A, B, C, D, F, P, I)'),
      updatedAfter: z.string().optional().describe('Show grades updated after this date (YYYY-MM-DD format)'),
      updatedBefore: z.string().optional().describe('Show grades updated before this date (YYYY-MM-DD format)'),
      multiValueFilters: z.array(z.object({
        field: z.enum(gradeColumnAccessorKeys as [string, ...string[]]).describe('Column to apply the IN-list filter to'),
        values: z.array(z.union([z.string(), z.number()])).min(2).max(20).describe('List of discrete values to include. Provide at least two values.')
      })).max(10).optional().describe(`Use when the user specifies multiple discrete values for a column (e.g. ${gradeColumnAccessorKeys.join(", ")}). The tool will apply a single “In list” filter for the specified field.`),
      sortBy: z.enum(['full_name', 'course_name', 'grade_letter', 'grade_percent', 'grade_code', 'updatedAt', 'local_course_code']).optional().describe('Field to sort by'),
      sortDirection: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" for ascending, "desc" for descending')
    }),
    execute: async (parsedFilters) => {
  const filters: string[] = [];
      const baseUrl = '/grades';

      // Consolidate filter parameters to support generic filter logic
      const filterConfig: Record<string, { operator: string; field?: string }> = {
        full_name: { operator: 'contains' },
        local_course_code: { operator: 'contains' },
        course_name: { operator: 'contains' },
        grade_letter: { operator: 'contains' },
        grade_code: { operator: 'eq' },
        credit_type: { operator: 'contains' },
        updatedAfter: { operator: 'gte', field: 'updatedAt' },
        updatedBefore: { operator: 'lte', field: 'updatedAt' }
      };

      for (const [key, value] of Object.entries(parsedFilters)) {
        if (!Object.keys(filterConfig).includes(key) || key === 'sortBy' || key === 'sortDirection') continue;
        const config = filterConfig[key];
        const fieldName = config.field || key;
        const filterValue = config.operator === 'contains' || config.operator === 'eq' 
          ? value as string
          : value;
        filters.push(`${fieldName}:${config.operator}:${filterValue}`);
      }

      // Handle numeric filter for grade percentage
      if (parsedFilters.grade_percent) {
        const { percentage, operator } = parsedFilters.grade_percent;
        
        switch (operator) {
          case 'eq':
            filters.push(`grade_percent:eq:${percentage}`);
            break;
          case 'gte':
            filters.push(`grade_percent:gte:${percentage}`);
            break;
          case 'lte':
            filters.push(`grade_percent:lte:${percentage}`);
            break;
        }
      }

      if (parsedFilters.gradePercentFilters && Array.isArray(parsedFilters.gradePercentFilters)) {
        for (const gradeFilterEntry of parsedFilters.gradePercentFilters) {
          const { percentage, operator } = gradeFilterEntry;

          switch (operator) {
            case 'eq':
              filters.push(`grade_percent:eq:${percentage}`);
              break;
            case 'gte':
              filters.push(`grade_percent:gte:${percentage}`);
              break;
            case 'lte':
              filters.push(`grade_percent:lte:${percentage}`);
              break;
          }
        }
      }

      if (parsedFilters.multiValueFilters && Array.isArray(parsedFilters.multiValueFilters)) {
        for (const multiFilter of parsedFilters.multiValueFilters) {
          const { field, values } = multiFilter;
          if (!field || !Array.isArray(values) || values.length === 0) {
            continue;
          }
          if (!gradeColumnAccessorKeys.includes(field)) {
            continue;
          }
          const normalizedValues: string[] = [];
          for (const rawValue of values) {
            if (rawValue === null || rawValue === undefined) {
              continue;
            }
            const stringValue = String(rawValue).trim();
            if (stringValue === '') {
              continue;
            }
            normalizedValues.push(stringValue);
          }
          if (normalizedValues.length === 0) {
            continue;
          }
          const uniqueValues = Array.from(new Set(normalizedValues));
          if (uniqueValues.length === 0) {
            continue;
          }
          const inList = uniqueValues.join('|');
          filters.push(`${field}:in:${inList}`);
        }
      }

      // Construct the URL
      let url = baseUrl;
      const queryParams: string[] = [];
      
      if (filters.length > 0) {
        const filterString = filters.join(',');
        queryParams.push(`filters=${encodeURIComponent(filterString)}`);
      }
      
      // Add sorting to URL if specified
      if (parsedFilters.sortBy && parsedFilters.sortDirection) {
        queryParams.push(`sort=${parsedFilters.sortBy}:${parsedFilters.sortDirection}`);
      }

      if (parsedFilters.columns && parsedFilters.columns.length > 0) {
        queryParams.push(`columns=${encodeURIComponent(parsedFilters.columns.join(','))}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      // The LLM will use the `url` and `filtersApplied` to generate a friendly response for the user.
      return {
        url,
        filtersApplied: parsedFilters,
      };
    }
  })
};
