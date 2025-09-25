import { CoreMessage, streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/utils/supabase/supabaseServer'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { FINALIZED_GRADE_CODES, CURRENT_YEAR_GRADE_CODES, ALL_GRADE_CODES } from '@/utils/gradeCodes'
import { fetchConfig } from '@/libs/configService'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json()

  // Fetch selectedSchoolId from cookies at the beginning so it's available to all tools
  const cookieStore = await cookies()
  const selectedSchoolId = cookieStore.get('selectedSchoolId')?.value

  const systemMessage = `You are a helpful AI assistant for school counselors and administrators. Your goal is to answer questions by querying the database or helping the user navigate the application. Select the best tool for the user's request based on the tool's description.

Key Guidelines:
- "Current year" refers to the school year where 'is_current' is true in the database.
- For any task involving a specific student, you must first use the 'identify_student' tool to get their unique ID. If the name is ambiguous, present the potential matches to the user for clarification.
- When referencing a student, use their full name and format it as a markdown link to their profile, like this: [Student's Full Name](/students/<studentId>).
- If the user asks a question that you can't answer with one of the other tools, you should inspect the database schema and see if there is a table that might be relevant (make sure to read the comments in the schema). If you find a table, use the \`get_table_schema\` tool to get the schema and understand the table better. Then use the \`execute_sql\` tool to execute a query on the table.
- Questions about students' goals, interests, and other non-academic information should be answered by looking for relevant tags in the tags table or meeting_notes. Search the tags table for potentially relevant tag names (if you don't find any relevant ones by assuming a name, then select all tag names and look for possibly relevant ones), then look in the student_tags table for the values to help answer the question. Questions about students' academic track should be contained by tags in the Academics tag_category.
- You may search the meeting_notes table for potentially relevant information about a single student. You may not search the meeting_notes table for information about multiple students at once.
- Provide only the final, user-facing answer. Do not include intermediate steps, tool outputs, or error messages in your response.`

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemMessage,
    messages,
    maxSteps: 10,
    // Uncomment to see some openai call results
    // onStepFinish: (step) => {
    //   console.log('step', step);
    // },
    tools: {
      filter_students: tool({
        description: `Applies filters to the student data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of students**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me 11th graders", "Find students with 'Smith' in their name.", "Show me students updated in the last 30 days", "Find students created in the last 7 days", "Show students with GPA below 2.0", "Find students with GPA above 3.5", "Show students whose first name is NOT Taylor", "Find students who have no email address", "Show students whose name does not contain 'John'", "Find students who are NOT part of homeroom 103"
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
            operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte', 'not']).default('eq').describe('The comparison operator for the GPA filter: "eq" (equal to), "gt" (greater than), "lt" (less than), "gte" (greater than or equal to), "lte" (less than or equal to), "not" (not equal to)')
          }).optional().describe('Filter students by cumulative GPA. For example, "students with GPA above 3.5" or "students with GPA below 2.0".'),
          ageFilter: z.object({
            age: z.number().describe('The age to filter by'),
            operator: z.enum(['eq', 'gte', 'lte', 'not']).default('eq').describe('The comparison operator for the age filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to), "not" (not equal to)')
          }).optional().describe('Filter students by age. For example, "students older than 15" or "10-year-old students".'),
          createdAtRecentOnly: z.number().positive().optional().describe('Filter students created in the last N days. Use when user asks for students "created", "added", or "registered" in recent time period.'),
          updatedAtRecentOnly: z.number().positive().optional().describe('Filter students updated in the last N days. Use when user asks for students "updated", "modified", or "changed" in recent time period.'),
          // New negative and empty value filters
          fullNameNot: z.string().optional().describe('Name that should NOT be in the student name (for "not equal" or "does not contain" queries)'),
          emailNot: z.string().optional().describe('Email that should NOT be in the student email (for "not equal" or "does not contain" queries)'),
          homeroomNameNot: z.string().optional().describe('Homeroom name that should NOT be in the student homeroom (for "not equal" or "does not contain" queries)'),
          emailEmpty: z.boolean().optional().describe('Filter for students with empty/null email addresses'),
          emailNotEmpty: z.boolean().optional().describe('Filter for students with non-empty email addresses'),
          fullNameEmpty: z.boolean().optional().describe('Filter for students with empty/null full names'),
          fullNameNotEmpty: z.boolean().optional().describe('Filter for students with non-empty full names')
        }),
        execute: async (parsedFilters) => {
          console.log('Executing filter_students tool with filters:', parsedFilters);
          const filters: string[] = [];
          const baseUrl = '/students';
    
          for (const [key, value] of Object.entries(parsedFilters)) {
            if (!value || key === 'ageFilter' || key === 'gpaFilter') continue;
            
            switch (key) {
              case 'gradeLevel':
              case 'enrollmentStatus':
              case 'gender':
              case 'graduationYear':
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
                filters.push(`dateOfBirth:contains:${birthYear}`);
                break;
              case 'gte': 
                // age >= X  means birth year <= Y
                filters.push(`dateOfBirth:lte:${birthYear}-12-31`);
                break;
              case 'lte':
                // age <= X means birth year >= Y
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
    
          // The LLM will use the `url` and `filtersApplied` to generate a friendly response for the user.

          return {
            url,
            filtersApplied: parsedFilters,
          };
        }
      }),
      filter_grades: tool({
        description: `Applies filters to the grades data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of grades**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me grades below 90%", "Show me all A grades", "Find grades for Math courses", "Display grades for John Smith"
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade did Jane Doe get in Math?" or "How many students got A's?". For those, you must query the database directly.`,
        parameters: z.object({
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
          };
        }
      }),
      list_tables: tool({
        description: `Lists all available tables in the database. Use the comments to understand the table better. This is the first step for answering a question that requires specific information. Use this if you do not know the database schema.`,
        parameters: z.object({}),
        execute: async () => {
          console.log('Executing list_tables tool');
          const supabase = await createClient()
          const { data, error } = await supabase.rpc('list_public_tables');

          if (error) {
            console.error('Error listing tables:', error);
            return { error: `Failed to list tables: ${error.message}` };
          }
          
          console.log('Tables found:', data);
          return data.map((t: { name: string }) => t.name);
        },
      }),
      get_table_schema: tool({
        description: 'Gets the schema (column names, data types, and comments) for a specific table. After finding relevant tables with `list_tables`, use this to understand their structure and purpose before writing a query.',
        parameters: z.object({
          tableName: z.string().describe('The name of the table to get the schema for.'),
        }),
        execute: async ({ tableName }) => {
          console.log(`Executing get_table_schema for table: ${tableName}`);
          const supabase = await createClient()
          const { data, error } = await supabase.rpc('get_public_table_schema', { p_table_name: tableName });

          if (error) {
            console.error(`Error getting schema for table ${tableName}:`, error);
            return { error: `Failed to get schema for table ${tableName}: ${error.message}` };
          }
          
          console.log(`Schema for ${tableName}:`, data);
          return data;
        },
      }),
      execute_sql: tool({
        description: `Executes a final, read-only SQL 'SELECT' query to get specific information from the database. Use this after you have explored the schema with 'list_tables' and 'get_table_schema' to construct a precise query.`,
        parameters: z.object({
          sql: z.string().describe('The SQL SELECT query to execute.'),
        }),
        execute: async ({ sql }) => {
          console.log(`Executing SQL: ${sql}`);
          if (!sql.trim().toLowerCase().startsWith('select')) {
            const err_msg = 'Only SELECT queries are allowed.';
            console.error(err_msg);
            return { error: err_msg };
          }

          const supabase = await createClient()
          const { data, error } = await supabase.rpc('execute_safe_select', { 
            query_text: sql,
            p_selected_school_id: selectedSchoolId
          });

          if (error) {
            console.error('Error executing SQL:', error);
            return { error: `Failed to execute query: ${error.message}` };
          }

          console.log('Query result:', data);
          return data;
        },
      }),
      // identify_student tool
      identify_student: tool({
        description: `Identifies a student by name to get their unique studentId. This is the first step for any query about a specific student. The search is automatically filtered to students the user has access to. It handles three cases:
1. Exact match: Returns the student's ID and full name.
2. Multiple matches: Returns a list of potential students for the user to choose from.
3. No matches: Returns a message indicating the student was not found.`,
        parameters: z.object({
          studentName: z.string().describe("The student's full name or partial name to search for."),
        }),
        execute: async ({ studentName }) => {
          console.log(`Executing identify_student for: "${studentName}" (RLS will filter by school)`);
          const supabase = await createClient();

          //query for students
          const { data: students, error } = await supabase
            .from('students')
            .select('student_id, full_name, grade_level')
            .ilike('full_name', `%${studentName}%`);

          if (error) {
            console.error('Error identifying student:', error);
            return { noMatchFound: `An error occurred: ${error.message}` };
          }

          if (!students || students.length === 0) {
            console.log(`No match found for "${studentName}"`);
            return { noMatchFound: `Could not find a student named "${studentName}". Please check the spelling or provide a more complete name.` };
          }

          if (students.length === 1) {
            const student = students[0];
            console.log(`Exact match found for "${studentName}": ${student.full_name} (${student.student_id})`);
            return {
              studentId: student.student_id,
              fullName: student.full_name,
            };
          }

          // Multiple matches found
          console.log(`Ambiguous match for "${studentName}". Found ${students.length} potential matches.`);
          return {
            potentialMatches: students.map(s => ({
              studentId: s.student_id,
              fullName: s.full_name,
              gradeLevel: s.grade_level,
            })),
          };
        },
      }),
      get_student_gpa: tool({
        description: `Retrieves a student's GPA after they have been unambiguously identified.
This tool requires a 'studentId'. You MUST call 'identify_student' first to get the studentId.
It can be filtered by various parameters like credit types (subjects) or school years.`,
        parameters: z.object({
          studentId: z.string().describe("The student's unique ID, obtained from the 'identify_student' tool."),
          method: z.string().optional().describe('GPA calculation method: simple, added_value, credit_hour_weighted'),
          gradeCodes: z.array(z.string()).optional().describe(`Filter by grade codes (${ALL_GRADE_CODES.join(', ')});`),
          creditTypes: z.array(z.string()).optional().describe('Filter by course subject(s), matching the credit_type in grade records (e.g., ["English", "Math"])'),
          yearLabels: z.array(z.string()).optional().describe('Filter by school year labels (e.g., ["2022-2023", "2023-2024"])'),
          gradeLevels: z.array(z.number()).optional().describe('Filter by grade levels (e.g., ["9", "10", "11", "12"])'),
        }),
        execute: async (parsed) => {
          console.log(`Executing get_student_gpa tool with parsed params: studentId="${parsed.studentId}", method="${parsed.method ?? 'simple'}", gradeCodes=${JSON.stringify(parsed.gradeCodes)}, creditTypes=${JSON.stringify(parsed.creditTypes)}, yearLabels=${JSON.stringify(parsed.yearLabels)}, gradeLevels=${JSON.stringify(parsed.gradeLevels)}`);
          const supabase = await createClient();

          const studentId = parsed.studentId;
          
          // ---------------------------------------------------------------------------------
          // Step 1: Fetch the label of the current school year (e.g. "2024-2025")
          // ---------------------------------------------------------------------------------

          const { data: currentYearData } = await supabase
            .from('years')
            .select('name')
            .eq('is_current', true)
            .single();

          const currentSchoolYearLabel: string | null = currentYearData?.name ?? null;

          // ---------------------------------------------------------------------------------
          // Step 2: Determine which grade codes to use
          //   • Default to FINALIZED_GRADE_CODES for past years
          //   • Switch to CURRENT_YEAR_GRADE_CODES when
          //     the filter explicitly references the current school year OR the
          //     special placeholder "current" / "current_year" is supplied.
          // ---------------------------------------------------------------------------------

          const configResponse = await fetchConfig({schoolId: selectedSchoolId, configKeys: ['final_grade_codes']});
          
          let yearLabelsFilter: string[] | null = parsed.yearLabels ? [...parsed.yearLabels] : null;
          const gradeLevelsFilter: number[] | null = parsed.gradeLevels ?? null;
          let defaultGradeCodes: readonly string[] = configResponse['final_grade_codes'] ? configResponse['final_grade_codes'] : FINALIZED_GRADE_CODES;

          if (yearLabelsFilter && yearLabelsFilter.length > 0) {
            // Replace placeholder tokens with the actual current year label
            const PLACEHOLDER_REGEX = /^(current|current_year)$/i;
            yearLabelsFilter = yearLabelsFilter.map((label) =>
              PLACEHOLDER_REGEX.test(label) && currentSchoolYearLabel ? currentSchoolYearLabel : label
            );

            // If, after replacement, the current school year label is in the filter -> use current year grade codes
            if (currentSchoolYearLabel && yearLabelsFilter.includes(currentSchoolYearLabel)) {  
              defaultGradeCodes = CURRENT_YEAR_GRADE_CODES;
            }
          }

          const gradeCodesFilter = parsed.gradeCodes ?? [...defaultGradeCodes];
          const creditTypesFilter = parsed.creditTypes ?? null;

          console.log('Computed get_student_gpa filters:', { gradeCodesFilter, creditTypesFilter, yearLabelsFilter });
          const { data: gpa, error } = await supabase.rpc('calculate_gpa_dispatch', {
            p_student_id: studentId,
            p_method: parsed.method ?? null,
            p_grade_codes: gradeCodesFilter,
            p_credit_types: creditTypesFilter,
            p_year_labels: yearLabelsFilter,
            p_grade_levels: gradeLevelsFilter,
          });
          if (error) {
            throw new Error(error.message);
          }
          // Round GPA to two decimals for consistency with bulk endpoint
          const rawGpa = gpa as number;
          const roundedGpa = typeof rawGpa === 'number' ? Number(rawGpa.toFixed(2)) : rawGpa;
          return { gpa: roundedGpa, method: parsed.method ?? 'simple' };
        },
      }),
    }
  })

  return result.toDataStreamResponse()
}