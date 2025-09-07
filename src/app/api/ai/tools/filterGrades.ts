import { tool } from 'ai'
import { z } from 'zod'
import { FilterResult, GradesFiltersApplied } from '@/types/ChatToolTypes'
import type { FilterGradesInput, FilterGradesOutput } from '@/types/ChatToolTypes';

/**
 * Generates a human-readable description of applied filters for display in UI buttons
 * @param filters - The filters that have been applied
 * @returns A string description of the filters, truncated if too long
 */
const generateGradesFilterDescription = (filters?: GradesFiltersApplied): string => {
    if (!filters || Object.keys(filters).length === 0) {
      return 'View All Grades';
    }
  
    const descriptions: string[] = [];
  
    if (filters.fullName) {
      descriptions.push(`student: "${filters.fullName}"`);
    }
    if (filters.course_localCourseCode) {
      descriptions.push(`course code: "${filters.course_localCourseCode}"`);
    }
    if (filters.course_name) {
      descriptions.push(`course: "${filters.course_name}"`);
    }
    if (filters.gradeLetter) {
      descriptions.push(`grade: ${filters.gradeLetter}`);
    }
    if (filters.gradePercentage) {
      const { percentage, operator } = filters.gradePercentage;
      switch (operator) {
        case 'eq':
          descriptions.push(`${percentage}%`);
          break;
        case 'gte':
          descriptions.push(`${percentage}%+`);
          break;
        case 'lte':
          descriptions.push(`≤${percentage}%`);
          break;
      }
    }
    if (filters.gradeCode) {
      descriptions.push(`code: ${filters.gradeCode}`);
    }
    if (filters.credit_type) {
      descriptions.push(`subject: ${filters.credit_type}`);
    }
    if (filters.updatedAfter) {
      descriptions.push(`updated after ${filters.updatedAfter}`);
    }
    if (filters.updatedBefore) {
      descriptions.push(`updated before ${filters.updatedBefore}`);
    }
  
    let fullDescription = `View grades: ${descriptions.join(', ')}`;
    if (fullDescription.length > 50) {
      fullDescription = fullDescription.substring(0, 47) + '...';
    }
    return fullDescription;
  };

export const filterGradesTool = tool<FilterGradesInput, FilterGradesOutput>({
    description: `Applies filters to the grades data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of grades**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me grades below 90%", "Show me all A grades", "Find grades for Math courses", "Display grades for John Smith"
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade did Jane Doe get in Math?" or "How many students got A's?". For those, you must query the database directly.`,
    inputSchema: z.object({
      fullName: z.string().optional().describe('Student name or part of name to search for'),
      course_localCourseCode: z.string().optional().describe('Course code or part of course code to search for'),
      credit_type: z.string().optional().describe('Credit type (e.g., Math, Science, English, History, Arts, etc.)'),
      course_name: z.string().optional().describe('Course name or part of course name to search for'),
      gradeLetter: z.string().optional().describe('Grade letter (e.g., A, B, C, D, F)'),
      gradePercentage: z.object({
        percentage: z.number().describe('The grade percentage to filter by'),
        operator: z.enum(['eq', 'gte', 'lte']).default('eq').describe('The comparison operator for the grade percentage filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to)')
      }).optional().describe('Filter grades by percentage. For example, "grades above 85%" or "90% grades".'),
      gradeCode: z.string().optional().describe('Grade code (e.g., A, B, C, D, F, P, I)'),
      updatedAfter: z.string().optional().describe('Show grades updated after this date (YYYY-MM-DD format)'),
      updatedBefore: z.string().optional().describe('Show grades updated before this date (YYYY-MM-DD format)'),
    }),
    execute: async (parsedFilters) => {
      console.log('Executing filter_grades tool with filters:', parsedFilters);
      const filters: string[] = [];
      const baseUrl = '/grades';

      // Consolidate filter parameters to start supporting generic filter logic
      const filterConfig: Record<string, { operator: string; field?: string }> = {
        fullName: { operator: 'contains' },
        course_localCourseCode: { operator: 'contains' },
        course_name: { operator: 'contains' },
        gradeLetter: { operator: 'contains' },
        gradeCode: { operator: 'eq' },
        credit_type: { operator: 'contains' },
        updatedAfter: { operator: 'gte', field: 'updatedAt' },
        updatedBefore: { operator: 'lte', field: 'updatedAt' }
      };

      for (const [key, value] of Object.entries(parsedFilters)) {
        if (!Object.keys(filterConfig).includes(key)) continue;
        const config = filterConfig[key];
        const fieldName = config.field || key;
        const filterValue = config.operator === 'contains' || config.operator === 'eq' 
          ? value as string
          : value;
        filters.push(`${fieldName}:${config.operator}:${filterValue}`);
      }

      // TODO: This kind of numeric filter (gte, lte, eq) will be added to the generic filter soon TM
      if (parsedFilters.gradePercentage) {
        const { percentage, operator } = parsedFilters.gradePercentage;
        
        switch (operator) {
          case 'eq':
            filters.push(`gradePercentage:eq:${percentage}`);
            break;
          case 'gte':
            filters.push(`gradePercentage:gte:${percentage}`);
            break;
          case 'lte':
            filters.push(`gradePercentage:lte:${percentage}`);
            break;
        }
      }

      // Construct the URL
      let url = baseUrl;
      if (filters.length > 0) {
        const filterString = filters.join(',');
        url += `?filters=${encodeURIComponent(filterString)}`;
      }

      // The LLM will use the `url` and `filtersApplied` to generate a friendly response for the user.
      return {
        url,
        filtersApplied: parsedFilters,
        description: generateGradesFilterDescription(parsedFilters)
      } as FilterResult;
    }
  })