import { tool } from 'ai'
import { z } from 'zod'
import { FilterResult, StudentsFiltersApplied } from '@/types/ChatToolTypes'
import type { FilterStudentsInput, FilterStudentsOutput } from '@/types/ChatToolTypes';

/**
 * Generates a human-readable description of applied filters for display in UI buttons
 * @param filters - The filters that have been applied
 * @returns A string description of the filters, truncated if too long
 */
const generateFilterDescription = (filters?: StudentsFiltersApplied): string => {
  if (!filters || Object.keys(filters).length === 0) {
    return 'View All Students';
  }

  const descriptions: string[] = [];

  if (filters.gradeLevel) {
    descriptions.push(`grade ${filters.gradeLevel}`);
  }
  if (filters.fullName) {
    descriptions.push(`name: "${filters.fullName}"`);
  }
  if (filters.enrollmentStatus) {
    descriptions.push(filters.enrollmentStatus);
  }
  if (filters.gender) {
    descriptions.push(filters.gender);
  }
  if (filters.homeroomName) {
    descriptions.push(`homeroom: "${filters.homeroomName}"`);
  }
  if (filters.graduationYear) {
    descriptions.push(`graduating ${filters.graduationYear}`);
  }
  if (filters.email) {
    descriptions.push(`email: "${filters.email}"`);
  }
  if (filters.ageFilter) {
    const { age, operator } = filters.ageFilter;
    switch (operator) {
      case 'eq':
        descriptions.push(`age ${age}`);
        break;
      case 'gte':
        descriptions.push(`age ${age}+`);
        break;
      case 'lte':
        descriptions.push(`age <= ${age}`);
        break;
    }
  }
  if (filters.gpaFilter) {
    const { value, operator } = filters.gpaFilter;
    switch (operator) {
      case 'eq':
        descriptions.push(`GPA ${value}`);
        break;
      case 'gt':
        descriptions.push(`GPA > ${value}`);
        break;
      case 'lt':
        descriptions.push(`GPA < ${value}`);
        break;
      case 'gte':
        descriptions.push(`GPA >= ${value}`);
        break;
      case 'lte':
        descriptions.push(`GPA <= ${value}`);
        break;
    }
  }
  if (filters.createdAtRecentOnly) {
    descriptions.push(`created in last ${filters.createdAtRecentOnly} days`);
  }
  if (filters.updatedAtRecentOnly) {
    descriptions.push(`updated in last ${filters.updatedAtRecentOnly} days`);
  }

  let fullDescription = `View students: ${descriptions.join(', ')}`;
  if (fullDescription.length > 50) {
    fullDescription = fullDescription.substring(0, 47) + '...';
  }
  return fullDescription;
};

export const filterStudentsTool = tool<FilterStudentsInput, FilterStudentsOutput>({
  description: `Applies filters to the student data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of students**. This tool is for navigation, not for answering questions. Do not include a url or link in your text response!

- **Correct Usage Examples**: "Show me 11th graders", "Find students with 'Smith' in their name.", "Show me students updated in the last 30 days", "Find students created in the last 7 days", "Show students with GPA below 2.0", "Find students with GPA above 3.5"
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade is Jane Doe in?" or "How many students are graduating this year?". For those, you must query the database directly.

**Date Filter Instructions:**
- When user asks for students "updated/modified/changed in the last X days", use updatedAtRecentOnly with the number of days
- When user asks for students "created/added/registered in the last X days", use createdAtRecentOnly with the number of days
- Examples: "last 30 days" = 30, "last week" = 7, "last month" = 30, "yesterday" = 1, "last 2 weeks" = 14`,
  inputSchema: z.object({
    gradeLevel: z.number().optional().describe('Grade level (e.g., 9, 10, 11, 12)'),
    fullName: z.string().optional().describe('Name or part of name to search for'),
    enrollmentStatus: z.enum(['active', 'inactive']).optional().describe('Student enrollment status'),
    gender: z.enum(['male', 'female']).optional().describe('Student gender'),
    homeroomName: z.string().optional().describe('Homeroom name or teacher'),
    graduationYear: z.number().optional().describe('Expected graduation year'),
    email: z.string().optional().describe('Email domain or part of email to search for'),
    gpaFilter: z.object({
      value: z.number().describe('The GPA value to filter by'),
      operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte']).default('eq').describe('The comparison operator for the GPA filter: "eq" (equal to), "gt" (greater than), "lt" (less than), "gte" (greater than or equal to), "lte" (less than or equal to)')
    }).optional().describe('Filter students by cumulative GPA. For example, "students with GPA above 3.5" or "students with GPA below 2.0".'),
    ageFilter: z.object({
      age: z.number().describe('The age to filter by'),
      operator: z.enum(['eq', 'gte', 'lte']).default('eq').describe('The comparison operator for the age filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to)')
    }).optional().describe('Filter students by age. For example, "students older than 15" or "10-year-old students".'),
    createdAtRecentOnly: z.number().positive().optional().describe('Filter students created in the last N days. Use when user asks for students "created", "added", or "registered" in recent time period.'),
    updatedAtRecentOnly: z.number().positive().optional().describe('Filter students updated in the last N days. Use when user asks for students "updated", "modified", or "changed" in recent time period.')
  }),
  execute: async (parsedFilters) => {
    console.log('Executing filter_students tool with filters:', parsedFilters)
    const filters: string[] = []
    const baseUrl = '/students'

    for (const [key, value] of Object.entries(parsedFilters)) {
      if (!value || key === 'ageFilter' || key === 'gpaFilter') continue

      switch (key) {
        case 'gradeLevel':
        case 'enrollmentStatus':
        case 'gender':
        case 'graduationYear':
          filters.push(`${key}:eq:${value}`)
          break
        case 'fullName':
        case 'homeroomName':
        case 'email':
          filters.push(`${key}:contains:${encodeURIComponent(value as string)}`)
          break
        case 'createdAtRecentOnly':
          filters.push(`createdAtRecentOnly:in:${value}`)
          break
        case 'updatedAtRecentOnly':
          filters.push(`updatedAtRecentOnly:in:${value}`)
          break
      }
    }

    if (parsedFilters.gpaFilter) {
      const { value, operator } = parsedFilters.gpaFilter
      filters.push(`gpa:${operator}:${value}`)
    }

    if (parsedFilters.ageFilter) {
      const { age, operator } = parsedFilters.ageFilter
      const currentYear = new Date().getFullYear()
      const birthYear = currentYear - age

      switch (operator) {
        case 'eq':
          // Assumes backend can handle year part for date contains
          filters.push(`dateOfBirth:contains:${birthYear}`)
          break
        case 'gte': // age >= X  means birth year <= Y
          filters.push(`dateOfBirth:lte:${birthYear}-12-31`)
          break
        case 'lte': // age <= X means birth year >= Y
          filters.push(`dateOfBirth:gte:${birthYear}-01-01`)
          break
      }
    }

    // Construct the URL
    let url = baseUrl
    if (filters.length > 0) {
      const filterString = filters.join(',')
      url += `?filters=${encodeURIComponent(filterString)}`
    }

    // Generate description for the applied filters
    const description = generateFilterDescription(parsedFilters);

    return {
      url,
      filtersApplied: parsedFilters,
      description,
    } as FilterResult;
  }
})


