create or replace view "public"."student_grades_with_current_year_view" as  SELECT sg.grade_id,
    sg.student_id,
    sg.course_id,
    sg.term_id,
    sg.grade_letter,
    sg.grade_code,
    sg.grade_percent,
    sg.gpa_points,
    sg.credit_type,
    sg.grade_status,
    sg.updated_at,
    c.name AS course_name,
    c.local_course_code,
    t.abbreviation AS term_abbreviation,
    y.year_id,
    y.name AS year_name,
    y.start_year,
    y.end_year,
    y.is_current
   FROM (((student_grades sg
     JOIN courses c ON ((sg.course_id = c.course_id)))
     JOIN terms t ON ((sg.term_id = t.term_id)))
     JOIN years y ON ((t.year_id = y.year_id)))
UNION ALL
 SELECT NULL::uuid AS grade_id,
    s.student_id,
    NULL::uuid AS course_id,
    NULL::uuid AS term_id,
    NULL::text AS grade_letter,
    NULL::text AS grade_code,
    NULL::numeric AS grade_percent,
    NULL::numeric AS gpa_points,
    NULL::text AS credit_type,
    'No Grades Yet'::text AS grade_status,
    NULL::timestamp with time zone AS updated_at,
    NULL::text AS course_name,
    NULL::text AS local_course_code,
    NULL::text AS term_abbreviation,
    y.year_id,
    y.name AS year_name,
    y.start_year,
    y.end_year,
    y.is_current
   FROM (students s
     JOIN years y ON ((y.is_current = true)))
  WHERE ((lower(s.enrollment_status) = 'active'::text) AND (NOT (EXISTS ( SELECT 1
           FROM (student_grades sg
             JOIN terms t2 ON ((sg.term_id = t2.term_id)))
          WHERE ((sg.student_id = s.student_id) AND (t2.year_id = y.year_id))))));



