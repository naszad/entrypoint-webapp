import { tool } from 'ai'
import { z } from 'zod'
import { navigate } from './navigate'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'

// Define the filter schema for AI to understand
const FilterSchema = z.object({
  gradeLevel: z.number().optional().describe('Grade level (e.g., 9, 10, 11, 12)'),
  fullName: z.string().optional().describe('Name or part of name to search for'),
  enrollmentStatus: z.enum(['active', 'inactive']).optional().describe('Student enrollment status'),
  gender: z.enum(['male', 'female']).optional().describe('Student gender'),
  homeroomName: z.string().optional().describe('Homeroom name or teacher'),
  graduationYear: z.number().optional().describe('Expected graduation year'),
  email: z.string().optional().describe('Email domain or part of email to search for'),
  ageFilter: z.object({
    age: z.number(),
    operator: z.enum(['eq', 'gte', 'lte']).default('eq')
  }).optional().describe('Age-based filtering')
});

// Tool for filtering student table with natural language
export const filterStudentTable = tool({
  description: 'Filter the student data table based on natural language requests and navigate to the filtered view',
  parameters: z.object({
    request: z.string().describe('Natural language request for filtering students (e.g., "show me 11th grade students", "find students with Smith in their name")')
  }),
  execute: async ({ request }) => {
    try {
      // Use AI to interpret the natural language request
      const { object: parsedFilters } = await generateObject({
        model: openai('gpt-4o-mini'),
        prompt: `Parse this student filtering request and extract the relevant filter criteria. Only include filters that are explicitly mentioned or clearly implied in the request. If no specific criteria are mentioned, return an empty object.

Request: "${request}"

Available filter types:
- gradeLevel: Grade level number (9-12)
- fullName: Student name or part of name to search for
- enrollmentStatus: "active" or "inactive" 
- gender: "male" or "female"
- homeroomName: Homeroom name or teacher name
- graduationYear: Expected graduation year (4-digit year)
- email: Email domain or part of email
- ageFilter: Age with operator (eq/gte/lte)

Examples:
- "show me 11th grade students" → { gradeLevel: 11 }
- "find students named Smith" → { fullName: "Smith" }
- "active male students in grade 10" → { gradeLevel: 10, enrollmentStatus: "active", gender: "male" }
- "students graduating in 2025" → { graduationYear: 2025 }`,
        schema: FilterSchema,
      });

      // Convert AI-parsed filters to URL filter format
      const filters: string[] = [];
      const baseUrl = '/students';

      if (parsedFilters.gradeLevel) {
        filters.push(`gradeLevel:eq:${parsedFilters.gradeLevel}`);
      }

      if (parsedFilters.fullName) {
        filters.push(`fullName:contains:${encodeURIComponent(parsedFilters.fullName)}`);
      }

      if (parsedFilters.enrollmentStatus) {
        filters.push(`enrollmentStatus:eq:${parsedFilters.enrollmentStatus}`);
      }

      if (parsedFilters.gender) {
        filters.push(`gender:eq:${parsedFilters.gender}`);
      }

      if (parsedFilters.homeroomName) {
        filters.push(`homeroomName:contains:${encodeURIComponent(parsedFilters.homeroomName)}`);
      }

      if (parsedFilters.graduationYear) {
        filters.push(`graduationYear:eq:${parsedFilters.graduationYear}`);
      }

      if (parsedFilters.email) {
        filters.push(`email:contains:${encodeURIComponent(parsedFilters.email)}`);
      }

      if (parsedFilters.ageFilter) {
        const { age, operator } = parsedFilters.ageFilter;
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        
        switch (operator) {
          case 'eq':
            filters.push(`dateOfBirth:contains:${birthYear}`);
            break;
          case 'gte':
            filters.push(`dateOfBirth:lte:${birthYear}-12-31`);
            break;
          case 'lte':
            filters.push(`dateOfBirth:gte:${birthYear}-01-01`);
            break;
        }
      }

      // Construct the URL
      let url = baseUrl;
      if (filters.length > 0) {
        const filterString = filters.join(',');
        url += `?filters=${encodeURIComponent(filterString)}`;
      }

      // Generate human-readable description
      let description = '';
      if (filters.length === 0) {
        description = 'All students';
      } else {
        const filterDescriptions: string[] = [];

        if (parsedFilters.gradeLevel) {
          filterDescriptions.push(`Grade ${parsedFilters.gradeLevel}`);
        }
        if (parsedFilters.fullName) {
          filterDescriptions.push(`Name contains "${parsedFilters.fullName}"`);
        }
        if (parsedFilters.enrollmentStatus) {
          filterDescriptions.push(`${parsedFilters.enrollmentStatus.charAt(0).toUpperCase() + parsedFilters.enrollmentStatus.slice(1)} students`);
        }
        if (parsedFilters.gender) {
          filterDescriptions.push(`${parsedFilters.gender.charAt(0).toUpperCase() + parsedFilters.gender.slice(1)} students`);
        }
        if (parsedFilters.homeroomName) {
          filterDescriptions.push(`Homeroom contains "${parsedFilters.homeroomName}"`);
        }
        if (parsedFilters.graduationYear) {
          filterDescriptions.push(`Graduating in ${parsedFilters.graduationYear}`);
        }
        if (parsedFilters.email) {
          filterDescriptions.push(`Email contains "${parsedFilters.email}"`);
        }
        if (parsedFilters.ageFilter) {
          const { age, operator } = parsedFilters.ageFilter;
          switch (operator) {
            case 'eq':
              filterDescriptions.push(`Age ${age}`);
              break;
            case 'gte':
              filterDescriptions.push(`Age ${age} or older`);
              break;
            case 'lte':
              filterDescriptions.push(`Age ${age} or younger`);
              break;
          }
        }

        description = `Students filtered by: ${filterDescriptions.join(', ')}`;
      }

      return {
        url,
        description,
        filtersApplied: filters.length,
        filterDetails: filters,
        parsedRequest: parsedFilters
      };

    } catch (error) {
      console.error('Error parsing filter request:', error);
      
      // Fallback to all students if parsing fails
      return {
        url: '/students',
        description: 'All students (filter parsing failed)',
        filtersApplied: 0,
        filterDetails: [],
        error: 'Could not parse the filtering request'
      };
    }
  },
})

export const tools = { 
  navigate,
  filterStudentTable
}