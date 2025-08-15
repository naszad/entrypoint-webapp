import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/supabaseServer'
import { FINALIZED_GRADE_CODES, CURRENT_YEAR_GRADE_CODES, ALL_GRADE_CODES } from '@/utils/gradeCodes'

export const getStudentGpaTool = tool({
  description: `Retrieves a student's GPA, optionally filtered by various parameters. Use the creditTypes parameter to filter by course subjects (matching the credit_type field, e.g., 'English', 'Math'). Use yearLabels to filter by school year labels (e.g., ['2022-2023', '2023-2024']). If no specific grade codes are provided, it defaults to finalized grades (${FINALIZED_GRADE_CODES.join(', ')}) for data from past years, but uses current year grades by grade code (${CURRENT_YEAR_GRADE_CODES.join(', ')}) when filtering by current year.`,
  parameters: z.object({
    studentName: z.string().describe("Full name or part of the student's name"),
    method: z.string().optional().describe('GPA calculation method: simple, added_value, credit_hour_weighted'),
    gradeCodes: z.array(z.string()).optional().describe(`Filter by grade codes (${ALL_GRADE_CODES.join(', ')});`),
    creditTypes: z.array(z.string()).optional().describe('Filter by course subject(s), matching the credit_type in grade records (e.g., ["English", "Math"])'),
    yearLabels: z.array(z.string()).optional().describe('Filter by school year labels (e.g., ["2022-2023", "2023-2024"])'),
    gradeLevels: z.array(z.number()).optional().describe('Filter by grade levels (e.g., ["9", "10", "11", "12"])'),
  }),
  execute: async (parsed) => {
    console.log(
      `Executing get_student_gpa tool with parsed params: studentName="${parsed.studentName}", method="${parsed.method ?? 'simple'}", gradeCodes=${JSON.stringify(parsed.gradeCodes)}, creditTypes=${JSON.stringify(parsed.creditTypes)}, yearLabels=${JSON.stringify(parsed.yearLabels)}, gradeLevels=${JSON.stringify(parsed.gradeLevels)}`
    )
    const supabase = await createClient()
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .ilike('full_name', `%${parsed.studentName}%`)
      .single()
    if (studentError || !student) {
      throw new Error('Student not found: ' + parsed.studentName)
    }
    const studentId = student.student_id

    // Step 1: Fetch the label of the current school year (e.g. "2024-2025")
    const { data: currentYearData } = await supabase
      .from('years')
      .select('name')
      .eq('is_current', true)
      .single()

    const currentSchoolYearLabel: string | null = currentYearData?.name ?? null

    // Step 2: Determine which grade codes to use
    let yearLabelsFilter: string[] | null = parsed.yearLabels ? [...parsed.yearLabels] : null
    const gradeLevelsFilter: number[] | null = parsed.gradeLevels ?? null
    let defaultGradeCodes: readonly string[] = FINALIZED_GRADE_CODES

    if (yearLabelsFilter && yearLabelsFilter.length > 0) {
      // Replace placeholder tokens with the actual current year label
      const PLACEHOLDER_REGEX = /^(current|current_year)$/i
      yearLabelsFilter = yearLabelsFilter.map((label) =>
        PLACEHOLDER_REGEX.test(label) && currentSchoolYearLabel ? currentSchoolYearLabel : label
      )

      // If, after replacement, the current school year label is in the filter -> use current year grade codes
      if (currentSchoolYearLabel && yearLabelsFilter.includes(currentSchoolYearLabel)) {
        defaultGradeCodes = CURRENT_YEAR_GRADE_CODES
      }
    }

    const gradeCodesFilter = parsed.gradeCodes ?? [...defaultGradeCodes]
    const creditTypesFilter = parsed.creditTypes ?? null

    console.log('Computed get_student_gpa filters:', {
      gradeCodesFilter,
      creditTypesFilter,
      yearLabelsFilter,
    })
    const { data: gpa, error } = await supabase.rpc('calculate_gpa_dispatch', {
      p_student_id: studentId,
      p_method: parsed.method ?? null,
      p_grade_codes: gradeCodesFilter,
      p_credit_types: creditTypesFilter,
      p_year_labels: yearLabelsFilter,
      p_grade_levels: gradeLevelsFilter,
    })
    if (error) {
      throw new Error(error.message)
    }
    // Round GPA to two decimals for consistency with bulk endpoint
    const rawGpa = gpa as number
    const roundedGpa = typeof rawGpa === 'number' ? Number(rawGpa.toFixed(2)) : rawGpa
    return { gpa: roundedGpa, method: parsed.method ?? 'simple' }
  },
})


