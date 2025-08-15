import { tool } from 'ai'
import { z } from 'zod'

export const filterStudentsTool = tool({
  description: `Applies filters to the student data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of students**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me 11th graders", "Find students with 'Smith' in their name.", "Show me students updated in the last 30 days", "Find students created in the last 7 days", "Show students with GPA below 2.0", "Find students with GPA above 3.5"
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade is Jane Doe in?" or "How many students are graduating this year?". For those, you must query the database directly.

**Date Filter Instructions:**
- When user asks for students "updated/modified/changed in the last X days", use updatedAtRecentOnly with the number of days
- When user asks for students "created/added/registered in the last X days", use createdAtRecentOnly with the number of days
- Examples: "last 30 days" = 30, "last week" = 7, "last month" = 30, "yesterday" = 1, "last 2 weeks" = 14`,
  parameters: z.object({
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

    // The LLM will use the `url` and `filtersApplied` to generate a friendly response for the user.
    return {
      url,
      filtersApplied: parsedFilters,
    }
  }
})


