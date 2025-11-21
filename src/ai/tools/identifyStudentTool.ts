import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';

interface StudentMatch {
  studentId: string;
  fullName: string;
  studentNumber: string | null;
  gradeLevel: number | null;
  profilePath: string;
}

export function createIdentifyStudentTool(context: ToolContext) {
  return tool({
    description:
      'Attempts to uniquely identify a student given a partial name. Always run this before referencing a specific student in follow-up queries.',
    inputSchema: z.object({
      query: z.string().min(2).describe('Full or partial name for the student. Supports first, last, or combined searches.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(25)
        .optional()
        .describe('Maximum number of candidate matches to return. Defaults to 10.')
    }),
    execute: async ({ query, limit }) => {
      const searchTerm = query.trim();
      if (!searchTerm) {
        return {
          matches: [],
          message: 'Provide at least two characters to search for a student.'
        };
      }

      const supabase = context.supabase;
      const tokens = searchTerm.split(/\s+/).filter(Boolean);
      const ilikePattern = `%${tokens.join('%')}%`;

      let studentQuery = supabase
        .schema('views')
        .from('student_profiles')
        .select('student_id, student_number, full_name, grade_level')
        .order('full_name', { ascending: true })
        .limit(limit ?? 10)
        .ilike('full_name', ilikePattern);

      if (context.selectedSchoolId) {
        studentQuery = studentQuery.eq('school_id', context.selectedSchoolId);
      }

      const { data, error } = await studentQuery;

      if (error) {
        console.error('identifyStudentTool error', error);
        return {
          matches: [],
          message: 'Encountered an unexpected error while searching for students.'
        };
      }

      const matches: StudentMatch[] = (data ?? []).map((row) => ({
        studentId: row.student_id,
        fullName: row.full_name,
        studentNumber: row.student_number,
        gradeLevel: row.grade_level,
        profilePath: `/students/${row.student_id}`
      }));

      if (matches.length === 0) {
        return {
          matches,
          message: `No students matched "${searchTerm}". Try another spelling or include both first and last name.`
        };
      }

      return {
        matches,
        message: matches.length === 1
          ? 'Student identified successfully. Reference the returned studentId for follow-up tools.'
          : 'Multiple candidates found. Ask the user to specify the correct student before proceeding.'
      };
    }
  });
}
