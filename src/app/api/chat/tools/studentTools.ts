/**
 * Student-specific Tools
 * Tools for identifying students and querying student-specific data
 */

import { tool } from 'ai';
import { z } from 'zod/v3';
import { ChatTool, ToolContext } from './types';
import { createClient } from '@/utils/supabase/supabaseServer';
import { fetchConfig } from '@/libs/configService';
import { FINALIZED_GRADE_CODES, CURRENT_YEAR_GRADE_CODES, ALL_GRADE_CODES } from '@/utils/gradeCodes';
import { QueryData } from '@supabase/supabase-js';

export const identifyStudentTool = (context: ToolContext): ChatTool => ({
  metadata: {
    name: 'identify_student',
    category: 'student',
    description: 'Identifies a student by name to get their unique studentId.',
    systemMessageRules: [
      'ALWAYS use identify_student first when working with a specific student',
      'If multiple matches are found, present all options to the user for clarification',
      'Never assume a student_id - always verify with this tool first'
    ]
  },
  definition: tool({
    description: `Identifies a student by name to get their unique studentId. This is the first step for any query about a specific student. The search is automatically filtered to students the user has access to. It handles three cases:
1. Exact match: Returns the student's ID and full name.
2. Multiple matches: Returns a list of potential students for the user to choose from.
3. No matches: Returns a message indicating the student was not found.`,
    inputSchema: z.object({
      firstName: z.string().describe("The student's first name or partial first name to search for."),
      middleName: z.string().describe("The student's middle name or initial to search for."),
      lastName: z.string().describe("The student's last name or partial last name to search for."),  
      studentName: z.string().describe("The student's full name or partial name to search for."),
    }),
    execute: async ({ firstName, middleName, lastName, studentName }) => {
      const supabase = await createClient();

      const partialMatchConditions = [];
      if (firstName) {
        partialMatchConditions.push(`first_name.ilike.%${firstName}%`);
      }
      if (middleName) {
        partialMatchConditions.push(`middle_name.ilike.%${middleName}%`);
      }
      if (lastName) {
        partialMatchConditions.push(`last_name.ilike.%${lastName}%`);
      }

      // Query for students scoped to the selected school (when available)
      const studentQuery = supabase
        .from('students')
        .select(`
          student_id,
          full_name,
          grade_level,
          schools!school_student_link!inner (school_id)
        `)
        .eq('schools.school_id', context.selectedSchoolId)
        .or(`full_name.ilike.%${studentName}%,and(${partialMatchConditions.join(',')})`)
        .order('full_name', { ascending: true});


      type studentQueryType = QueryData<typeof studentQuery>;
      const { data, error } = await studentQuery;
      const students = data as studentQueryType;

      if (error) {
        console.error('Error identifying student:', error);
        return { noMatchFound: `An error occurred: ${error.message}` };
      }

      if (!students || students.length === 0) {
        return { noMatchFound: `Could not find a student named "${studentName}". Please check the spelling or provide a more complete name.` };
      }

      if (students.length === 1) {
        const student = students[0];
        return {
          studentId: student.student_id,
          fullName: student.full_name,
        };
      }

      // Multiple matches found
      return {
        potentialMatches: students.map(s => ({
          studentId: s.student_id,
          fullName: s.full_name,
          gradeLevel: s.grade_level,
        })),
      };
    },
  })
});

export const getStudentGpaTool = (context: ToolContext): ChatTool => ({
  metadata: {
    name: 'get_student_gpa',
    category: 'student',
    description: 'Retrieves a student\'s GPA with various filters.',
    systemMessageRules: [
      'MUST call identify_student first to get the studentId',
      'Default to FINALIZED_GRADE_CODES for past years',
      'Use CURRENT_YEAR_GRADE_CODES when filtering by current school year',
      'Can filter by credit types, year labels, and grade levels'
    ]
  },
  definition: tool({
    description: `Retrieves a student's GPA after they have been unambiguously identified.
This tool requires a 'studentId'. You MUST call 'identify_student' first to get the studentId.
It can be filtered by various parameters like credit types (subjects) or school years.`,
    inputSchema: z.object({
      studentId: z.string().describe("The student's unique ID, obtained from the 'identify_student' tool."),
      method: z.string().optional().describe('GPA calculation method: simple, added_value, credit_hour_weighted'),
      gradeCodes: z.array(z.string()).optional().describe(`Filter by grade codes (${ALL_GRADE_CODES.join(', ')});`),
      creditTypes: z.array(z.string()).optional().describe('Filter by course subject(s), matching the credit_type in grade records (e.g., ["English", "Math"])'),
      yearLabels: z.array(z.string()).optional().describe('Filter by school year labels (e.g., ["2022-2023", "2023-2024"])'),
      gradeLevels: z.array(z.number()).optional().describe('Filter by grade levels (e.g., ["9", "10", "11", "12"])'),
    }),
    execute: async (parsed) => {
      const supabase = await createClient();
      const studentId = parsed.studentId;
      
      // Step 1: Fetch the label of the current school year (e.g. "2024-2025")
      const { data: currentYearData } = await supabase
        .from('years')
        .select('name')
        .eq('is_current', true)
        .single();

      const currentSchoolYearLabel: string | null = currentYearData?.name ?? null;

      // Step 2: Determine which grade codes to use
      const configResponse = await fetchConfig({
        schoolId: context.selectedSchoolId, 
        configKeys: ['final_grade_codes']
      });
      
      let yearLabelsFilter: string[] | null = parsed.yearLabels ? [...parsed.yearLabels] : null;
      const gradeLevelsFilter: number[] | null = parsed.gradeLevels ?? null;
      let defaultGradeCodes: readonly string[] = configResponse['final_grade_codes'] ? 
        configResponse['final_grade_codes'] : FINALIZED_GRADE_CODES;

      if (yearLabelsFilter && yearLabelsFilter.length > 0) {
        // Replace placeholder tokens with the actual current year label
        const PLACEHOLDER_REGEX = /^(current|current_year)$/i;
        yearLabelsFilter = yearLabelsFilter.map((label) =>
          PLACEHOLDER_REGEX.test(label) && currentSchoolYearLabel ? currentSchoolYearLabel : label
        );

        // If current school year label is in the filter -> use current year grade codes
        if (currentSchoolYearLabel && yearLabelsFilter.includes(currentSchoolYearLabel)) {  
          defaultGradeCodes = CURRENT_YEAR_GRADE_CODES;
        }
      }

      const gradeCodesFilter = parsed.gradeCodes ?? [...defaultGradeCodes];
      const creditTypesFilter = parsed.creditTypes ?? null;
      
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
      
      // Round GPA to two decimals for consistency
      const rawGpa = gpa as number;
      const roundedGpa = typeof rawGpa === 'number' ? Number(rawGpa.toFixed(2)) : rawGpa;
      return { gpa: roundedGpa, method: parsed.method ?? 'simple' };
    },
  })
});
