import z from "zod";
import { tool } from "ai";
import { createClient } from "@/utils/supabase/supabaseServer";
import type { IdentifyStudentInput, IdentifyStudentOutput } from "@/types/ChatToolTypes";

export const identifyStudentTool = tool<IdentifyStudentInput, IdentifyStudentOutput>({
    description: `Identifies a student by name to get their unique studentId. This is the first step for any query about a specific student. The search is automatically filtered to students the user has access to. It handles three cases:
1. Exact match: Returns the student's ID and full name.
2. Multiple matches: Returns a list of potential students for the user to choose from.
3. No matches: Returns a message indicating the student was not found.`,
    inputSchema: z.object({
      studentName: z.string().describe("The student's full name or partial name to search for."),
    }),
    execute: async ( { studentName } ) => {
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
  })