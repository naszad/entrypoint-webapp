/**
 * Filter Students Tool
 * Navigates to filtered student table view based on natural language queries
 */

import { tool } from 'ai';
import { z } from 'zod/v3';
import { ChatTool } from './types';

export const filterStudentsTool: ChatTool = {
  metadata: {
    name: 'filter_students',
    category: 'navigation',
    description: 'Applies filters and sorting to the student data table and navigates the user to the filtered view.',
    systemMessageRules: [
      'Use filter_students ONLY when the user wants to view, show, find, or display a list/table of students',
      'This tool is for navigation, not for answering questions - do not use for queries like "What grade is Jane Doe in?"',
      'When user asks for students "updated/modified/changed in the last X days", use updatedAtRecentOnly',
      'When user asks for students "created/added/registered in the last X days", use createdAtRecentOnly',
      'For sorting, use sortBy and sortDirection parameters with supported fields: fullName, email, gradeLevel, gender, enrollmentStatus, homeroomName, gpa'
    ]
  },
  definition: tool({
    description: `Applies filters and sorting to the student data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of students**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me 11th graders", "Find students with 'Smith' in their name.", "Show me students updated in the last 30 days", "Find students created in the last 7 days", "Show students with GPA below 2.0", "Find students with GPA above 3.5", "Show students whose first name is NOT Taylor", "Find students who have no email address", "Show students whose name does not contain 'John'", "Find students who are NOT part of homeroom 103", "Show me grade 12 students sorted by email descending", "Find all students and sort by grade level ascending"
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade is Jane Doe in?" or "How many students are graduating this year?". For those, you must query the database directly.

**Date Filter Instructions:**
- When user asks for students "updated/modified/changed in the last X days", use updatedAtRecentOnly with the number of days
- When user asks for students "created/added/registered in the last X days", use createdAtRecentOnly with the number of days
- Examples: "last 30 days" = 30, "last week" = 7, "last month" = 30, "yesterday" = 1, "last 2 weeks" = 14

**Sorting Instructions:**
- When user asks to sort by a field, use sortBy and sortDirection parameters
- Sortable fields: fullName, email, gradeLevel, gender, enrollmentStatus, homeroomName, gpa
- Direction: "asc" for ascending (A-Z, low to high), "desc" for descending (Z-A, high to low)`,
    inputSchema: z.object({
      gradeLevel: z.number().optional().describe('Grade level (e.g., 9, 10, 11, 12)'),
      fullName: z.string().optional().describe('Name or part of name to search for'),
      enrollmentStatus: z.enum(['Active', 'Inactive']).optional().describe('Student enrollment status'),
      gender: z.enum(['male', 'female']).optional().describe('Student gender'),
      homeroomName: z.string().optional().describe('Homeroom name or teacher'),
      graduationYear: z.number().optional().describe('Expected graduation year'),
      studentNumber: z.string().optional().describe('Student number or part of student number to search for'),
      email: z.string().optional().describe('Email domain or part of email to search for'),
      gpaFilter: z.object({
        value: z.number().describe('The GPA value to filter by'),
        operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte', 'not']).default('eq').describe('The comparison operator for the GPA filter: "eq" (equal to), "gt" (greater than), "lt" (less than), "gte" (greater than or equal to), "lte" (less than or equal to), "not" (not equal to)')
      }).optional().describe('Filter students by cumulative GPA. For example, "students with GPA above 3.5" or "students with GPA below 2.0".'),
      ageFilter: z.object({
        age: z.number().describe('The age to filter by'),
        operator: z.enum(['eq', 'gte', 'lte', 'not']).default('eq').describe('The comparison operator for the age filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to), "not" (not equal to)')
      }).optional().describe('Filter students by age. For example, "students older than 15" or "10-year-old students".'),
      createdAtRecentOnly: z.number().positive().optional().describe('Filter students created in the last N days. Use when user asks for students "created", "added", or "registered" in recent time period.'),
      updatedAtRecentOnly: z.number().positive().optional().describe('Filter students updated in the last N days. Use when user asks for students "updated", "modified", or "changed" in recent time period.'),
      // Negative and empty value filters
      fullNameNot: z.string().optional().describe('Name that should NOT be in the student name (for "not equal" or "does not contain" queries)'),
      emailNot: z.string().optional().describe('Email that should NOT be in the student email (for "not equal" or "does not contain" queries)'),
      homeroomNameNot: z.string().optional().describe('Homeroom name that should NOT be in the student homeroom (for "not equal" or "does not contain" queries)'),
      emailEmpty: z.boolean().optional().describe('Filter for students with empty/null email addresses'),
      emailNotEmpty: z.boolean().optional().describe('Filter for students with non-empty email addresses'),
      fullNameEmpty: z.boolean().optional().describe('Filter for students with empty/null full names'),
      fullNameNotEmpty: z.boolean().optional().describe('Filter for students with non-empty full names'),
      // Sorting parameters
      sortBy: z.enum(['fullName', 'email', 'gradeLevel', 'gender', 'enrollmentStatus', 'homeroomName', 'gpa']).optional().describe('Field to sort by'),
      sortDirection: z.enum(['asc', 'desc']).optional().describe('Sort direction: "asc" for ascending, "desc" for descending')
    }),
    execute: async (parsedFilters) => {
      const filters: string[] = [];
      const baseUrl = '/students';

      for (const [key, value] of Object.entries(parsedFilters)) {
        if (!value || key === 'ageFilter' || key === 'gpaFilter' || key === 'sortBy' || key === 'sortDirection') continue;
        
        switch (key) {
          case 'gradeLevel':
          case 'enrollmentStatus':
          case 'gender':
          case 'graduationYear':
          case 'studentNumber':
            filters.push(`${key}:eq:${value}`);
            break;
          case 'fullName':
          case 'homeroomName':
          case 'email':
            filters.push(`${key}:contains:${encodeURIComponent(value as string)}`);
            break;
          case 'fullNameNot':
            filters.push(`fullName:not_contains:${encodeURIComponent(value as string)}`);
            break;
          case 'emailNot':
            filters.push(`email:not_contains:${encodeURIComponent(value as string)}`);
            break;
          case 'homeroomNameNot':
            filters.push(`homeroomName:not_contains:${encodeURIComponent(value as string)}`);
            break;
          case 'emailEmpty':
            if (value === true) {
              filters.push(`email:is_empty:true`);
            }
            break;
          case 'emailNotEmpty':
            if (value === true) {
              filters.push(`email:is_not_empty:true`);
            }
            break;
          case 'fullNameEmpty':
            if (value === true) {
              filters.push(`fullName:is_empty:true`);
            }
            break;
          case 'fullNameNotEmpty':
            if (value === true) {
              filters.push(`fullName:is_not_empty:true`);
            }
            break;
          case 'createdAtRecentOnly':
            filters.push(`createdAtRecentOnly:in:${value}`);
            break;
          case 'updatedAtRecentOnly':
            filters.push(`updatedAtRecentOnly:in:${value}`);
            break;
        }
      }

      if (parsedFilters.gpaFilter) {
        const { value, operator } = parsedFilters.gpaFilter;
        filters.push(`gpa:${operator}:${value}`);
      }

      if (parsedFilters.ageFilter) {
        const { age, operator } = parsedFilters.ageFilter;
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        
        switch (operator) {
          case 'eq':
            // Assumes backend can handle year part for date contains
            filters.push(`date_of_birth:contains:${birthYear}`);
            break;
          case 'gte': 
            // age >= X  means birth year <= Y
            filters.push(`date_of_birth:lte:${birthYear}-12-31`);
            break;
          case 'lte':
            // age <= X means birth year >= Y
            filters.push(`date_of_birth:gte:${birthYear}-01-01`);
            break;
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
