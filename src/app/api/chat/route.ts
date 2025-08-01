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

If at any point it seems like the user hasn't provided enough information to answer their question, make use of the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`) to find the information you need.
For example, if the user asks about a student's GPA, but only provides their first name, you can use the database tools to narrow down what student they are referring to, retrieve their full name, and call the \`get_student_gpa\` tool.

If the user asks about a student and provides a name which does not appear in the database, use the database tools to identify if the user provided a nickname or shortened name of a student that is in the database.
All students referenced in your response should be referred to by their full name in order to avoid confusion.

When a user asks a question, first determine their intent:
1.  Are they asking to **view, find, or display a list of students**? If so, your goal is to navigate them to the right page. Use the \`filter_students\` tool.
2.  Are they asking for a **specific piece of information, a fact, or a calculation** (e.g., "What grade is Jane Doe in?" or "How many students are there?")? If so, your goal is to find the answer in the database. Use the database query tools (\`list_tables\`, \`get_table_schema\`, \`execute_sql\`).
3.  Are they asking for a **student's GPA or a filtered slice of their GPA** (e.g., cumulative or by subject)? If so, use the \`get_student_gpa\` tool with parameters \`studentName\`, \`method\`, \`gradeCodes\`, \`gradeLevels\`, \`creditTypes\`, and \`termIds\`.

Once you have the answer or have performed the navigation, present the information to the user in a clear and friendly format.

Do NOT include any intermediate attempts, error messages, or debugging commentary in your response. Only present the final answer message to the user.
`

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemMessage,
    messages,
    maxSteps: 10,
    tools: {
      filter_students: tool({
        description: `Applies filters to the student data table and navigates the user to the filtered view.

Use this tool **only** when the user's request is to **view, show, find, or display a list/table of students**. This tool is for navigation, not for answering questions. Do not include the URL in your response, as a button will be displayed below the message in the UI.

- **Correct Usage Examples**: "Show me 11th graders", "Find students with 'Smith' in their name."
- **Incorrect Usage**: Do not use this for questions asking for a specific fact, like "What grade is Jane Doe in?" or "How many students are graduating this year?". For those, you must query the database directly.`,
        parameters: z.object({
          gradeLevel: z.number().optional().describe('Grade level (e.g., 9, 10, 11, 12)'),
          fullName: z.string().optional().describe('Name or part of name to search for'),
          enrollmentStatus: z.enum(['active', 'inactive']).optional().describe('Student enrollment status'),
          gender: z.enum(['male', 'female']).optional().describe('Student gender'),
          homeroomName: z.string().optional().describe('Homeroom name or teacher'),
          graduationYear: z.number().optional().describe('Expected graduation year'),
          email: z.string().optional().describe('Email domain or part of email to search for'),
          ageFilter: z.object({
            age: z.number().describe('The age to filter by'),
            operator: z.enum(['eq', 'gte', 'lte']).default('eq').describe('The comparison operator for the age filter: "eq" (equal to), "gte" (greater than or equal to), "lte" (less than or equal to)')
          }).optional().describe('Filter students by age. For example, "students older than 15" or "10-year-old students".')
        }),
        execute: async (parsedFilters) => {
          console.log('Executing filter_students tool with filters:', parsedFilters);
          const filters: string[] = [];
          const baseUrl = '/students';
    
          for (const [key, value] of Object.entries(parsedFilters)) {
            if (!value || key === 'ageFilter') continue;
            
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
            }
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
              case 'gte': // age >= X  means birth year <= Y
                filters.push(`dateOfBirth:lte:${birthYear}-12-31`);
                break;
              case 'lte': // age <= X means birth year >= Y
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
      get_student_gpa: tool({
        description: `Retrieves a student's GPA, optionally filtered by various parameters. Use the creditTypes parameter to filter by course subjects (matching the credit_type field, e.g., 'English', 'Math'). Use yearLabels to filter by school year labels (e.g., ['2022-2023', '2023-2024']). If no specific grade codes are provided, it defaults to finalized grades (${FINALIZED_GRADE_CODES.join(', ')}) for data from past years, but uses current year grades by grade code (${CURRENT_YEAR_GRADE_CODES.join(', ')}) when filtering by current year.`,
        parameters: z.object({
          studentName: z.string().describe('Full name or part of the student\'s name'),
          method: z.string().optional().describe('GPA calculation method: simple, added_value, credit_hour_weighted'),
          gradeCodes: z.array(z.string()).optional().describe(`Filter by grade codes (${ALL_GRADE_CODES.join(', ')});`),
          creditTypes: z.array(z.string()).optional().describe('Filter by course subject(s), matching the credit_type in grade records (e.g., ["English", "Math"])'),
          yearLabels: z.array(z.string()).optional().describe('Filter by school year labels (e.g., ["2022-2023", "2023-2024"])'),
          gradeLevels: z.array(z.number()).optional().describe('Filter by grade levels (e.g., ["9", "10", "11", "12"])'),
        }),
        execute: async (parsed) => {
          console.log(`Executing get_student_gpa tool with parsed params: studentName="${parsed.studentName}", method="${parsed.method ?? 'simple'}", gradeCodes=${JSON.stringify(parsed.gradeCodes)}, creditTypes=${JSON.stringify(parsed.creditTypes)}, yearLabels=${JSON.stringify(parsed.yearLabels)}, gradeLevels=${JSON.stringify(parsed.gradeLevels)}`);
          const supabase = await createClient();
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('student_id')
            .ilike('full_name', `%${parsed.studentName}%`)
            .single();
          if (studentError || !student) {
            throw new Error('Student not found: ' + parsed.studentName);
          }
          const studentId = student.student_id;
          
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
