import { CoreMessage, streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/utils/supabase/supabaseServer'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { FINALIZED_GRADE_CODES, CURRENT_YEAR_GRADE_CODES, ALL_GRADE_CODES } from '@/utils/gradeCodes'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json()

  const systemMessage = `
You are a helpful AI assistant for school counselors. Your goal is to answer questions by querying the school's database or by helping the user navigate the application.
When the user asks about their "current year" (e.g., "current year GPA"), you must interpret this as the school year with is_current = true in the database and pass that year label to the get_student_gpa tool via the yearLabels parameter.

When a user asks a question about a specific student, you MUST follow this sequence:
1.  Use the 'identify_student' tool with the name provided by the user.
2.  Analyze the result from 'identify_student':
    a. If it returns a single 'studentId', you have successfully identified the student. You can now use this 'studentId' in other tools like 'get_student_gpa'.
    b. If it returns a list of 'potentialMatches', the name is ambiguous. You MUST present this list to the user and ask them to clarify which student they mean. Do not proceed with other tools.
    c. If it returns a 'noMatchFound' message, inform the user that you could not find the student and ask them to provide a more specific name or check the spelling. Do not proceed with other tools.

All students referenced in your response should be referred to by their full name. When you respond with the student's full name, you should make their name a markdown link to the student's page in the application using the format: [student's full name](/students/<studentId>).

When a user asks a question, first determine their intent:

1.  Are they asking to **view, find, or display a list of students**? If so, your goal is to navigate them to the right page. Use the \`filter_students\` tool **if** their query can be answered using the filters available in the filter_students tool. If it can't, use the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`) to find the information you need.
2.  Are they asking to **view, find, or display a list of grades**? If so, your goal is to navigate them to the right page. Use the \`filter_grades\` tool **if** their query can be answered using the filters available in the filter_grades tool. If it can't, use the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`) to find the information you need.
3.  Are they asking for a **specific piece of information, a fact, or a calculation** (e.g., "What grade is Jane Doe in?" or "How many students are there?")? If so, your goal is to find the answer in the database. First use 'identify_student' if a name is mentioned, then use the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`).
4.  Are they asking for a **student's GPA or a filtered slice of their GPA**? If so, you MUST first use the \`identify_student\` tool to get an unambiguous studentId. Once you have the studentId, use the \`get_student_gpa\` tool.
5.  Are they asking to **filter students by GPA** (e.g., "show me students with GPA below 2.0", "students with GPA above 3.5")? Use the \`filter_students\` tool with the \`gpaFilter\` parameter.

Once you have the answer or have performed the navigation, present the information to the user in a clear and friendly format.

Do NOT include any intermediate attempts, error messages, or debugging commentary in your response. Only present the final answer message to the user.
`

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemMessage,
    messages,
    maxSteps: 10,
    // Uncomment to see some openai call results
    // onStepFinish: (step) => {
      // console.log('step', step);
    // },
    tools: {
      filter_students: tool({
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
        description: 'Lists all available tables in the database. This is the first step for answering a question that requires specific information. Use this if you do not know the database schema.',
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
        description: 'Gets the schema (column names and data types) for a specific table. After finding relevant tables with `list_tables`, use this to understand their structure before writing a query.',
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

          const cookieStore = cookies()
          const selectedSchoolId = (await cookieStore).get('selectedSchoolId')?.value


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
        description: `Identifies a student by name to get their unique studentId. This is the first step for any query about a specific student. The search is automatically filtered to students the counselor has access to. It handles three cases:
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
          
          let yearLabelsFilter: string[] | null = parsed.yearLabels ? [...parsed.yearLabels] : null;
          const gradeLevelsFilter: number[] | null = parsed.gradeLevels ?? null;
          let defaultGradeCodes: readonly string[] = FINALIZED_GRADE_CODES;

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