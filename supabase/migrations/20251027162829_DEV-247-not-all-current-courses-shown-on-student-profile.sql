set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_current_student_grades(p_student_id uuid)
 RETURNS TABLE(course_id uuid, course_name text, course_number text, grade_letter text, grade_percent numeric, updated_at timestamp with time zone, term_abbreviation text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Return the latest grades for the current (or most recent) term in one go
  RETURN QUERY
    WITH current_term AS (
      SELECT term_id, abbreviation
      FROM terms
      WHERE current_date between start_date::date AND end_date::date
    ),
    fallback_term AS (
      -- Fallback to most recent term where the student has grades
      SELECT td.term_id, td.abbreviation
      FROM terms td
      JOIN student_grades sg ON sg.term_id = td.term_id AND sg.student_id = p_student_id
      GROUP BY td.term_id, td.abbreviation, td.end_date
      ORDER BY td.end_date DESC NULLS LAST
      LIMIT 1
    ),
    chosen_term AS (
      SELECT * FROM current_term
      UNION ALL
      SELECT * FROM fallback_term WHERE NOT EXISTS (SELECT 1 FROM current_term)
    ),
    enrolls AS (
      SELECT se.section_id, se.term_id
      FROM section_enrollments se
      JOIN chosen_term ct ON se.term_id = ct.term_id
      WHERE se.student_id = p_student_id
    ),
    latest_grades AS (
      SELECT DISTINCT ON (c.course_id)
        c.course_id,
        c.name               AS course_name,
        c.local_course_code  AS course_number,
        sg.grade_letter,
        sg.grade_percent,
        sg.source_updated_date::timestamp with time zone AS updated_at,
        ct.abbreviation      AS term_abbreviation
      FROM enrolls e
      JOIN sections s ON s.section_id = e.section_id
      JOIN courses c ON c.course_id = s.course_id
      LEFT JOIN student_grades sg ON sg.section_id = s.section_id
                                 AND sg.student_id = p_student_id
      JOIN chosen_term ct ON e.term_id = ct.term_id
      ORDER BY c.course_id, sg.updated_at DESC NULLS LAST
    )
    SELECT * FROM latest_grades ORDER BY course_name, course_number;
END;
$function$
;


