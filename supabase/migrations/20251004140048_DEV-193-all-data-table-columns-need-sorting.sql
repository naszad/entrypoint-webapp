create or replace view "public"."latest_student_grades_courses_students_view" as  SELECT sg.grade_id,
    sg.student_id,
    sg.section_id,
    sg.term_id,
    sg.course_id,
    sg.grade_letter,
    sg.grade_code,
    sg.grade_percent,
    sg.gpa_points,
    sg.credit_hours_earned,
    sg.potential_credit_hours,
    sg.gpa_added_value,
    sg.exclude_from_gpa,
    sg.credit_type,
    sg.grade_status,
    sg.comment,
    sg.grade_level,
    sg.source_api,
    sg.source_updated_date,
    sg.external_source,
    sg.external_name,
    sg.external_id,
    sg.external_key,
    sg.external_key_hash,
    sg.created_at,
    sg.updated_at,
    sg.customer_id,
    c.name AS course_name,
    c.local_course_code,
    c.state_course_code,
    c.school_id,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.full_name,
    s.email,
    s.phone,
    s.gender,
    s.date_of_birth,
    s.graduation_year,
    s.enrollment_status,
    s.homeroom_name
   FROM ((latest_student_grades sg
     JOIN students s ON ((s.student_id = sg.student_id)))
     JOIN courses c ON ((c.course_id = sg.course_id)));


create or replace view "public"."meeting_notes_students_school_student_link_view" as  SELECT mn.meeting_note_id,
    mn.user_id,
    mn.summary,
    mn.notes,
    mn.private,
    mn.transcript,
    mn.created_at,
    mn.updated_at,
    s.student_id,
    s.full_name,
    ssl.school_id
   FROM ((meeting_notes mn
     JOIN students s ON ((s.student_id = mn.student_id)))
     JOIN school_student_link ssl ON ((ssl.student_id = s.student_id)));


create or replace view "public"."school_student_link_students_view" as  SELECT ssl.student_id,
    ssl.school_id,
    ssl.created_at,
    ssl.updated_at,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.full_name,
    s.email,
    s.phone,
    s.grade_level,
    s.gender,
    s.date_of_birth,
    s.external_source,
    s.external_key,
    s.external_id,
    s.external_key_hash,
    s.external_name,
    s.graduation_year,
    s.enrollment_status,
    s.student_number,
    s.lunch_id,
    s.state_student_number,
    s.race,
    s.homeroom_name,
    s.customer_id
   FROM (school_student_link ssl
     JOIN students s ON ((s.student_id = ssl.student_id)));


create or replace view "public"."section_enrollments_terms_years_sections_courses_view" as  SELECT se.section_enrollment_id,
    se.student_id,
    se.section_id,
    se.term_id,
    se.tardies,
    se.external_source,
    se.created_at,
    se.updated_at,
    t.abbreviation,
    y.year_id,
    y.name AS year_name,
    c.course_id,
    c.name AS course_name,
    c.local_course_code
   FROM ((((section_enrollments se
     JOIN terms t ON ((se.term_id = t.term_id)))
     JOIN years y ON ((t.year_id = y.year_id)))
     JOIN sections s ON ((se.section_id = s.section_id)))
     JOIN courses c ON ((s.course_id = c.course_id)))
  WHERE (se.tardies > 0);


create or replace view "public"."student_daily_absences_years_view" as  SELECT sda.student_daily_absence_id,
    sda.student_id,
    sda.absence_date,
    sda.year_id,
    sda.sis_code,
    sda.normalized_absence_code,
    sda.external_source,
    sda.external_name,
    sda.created_at,
    sda.updated_at,
    y.name AS year_name
   FROM (student_daily_absences sda
     JOIN years y ON ((sda.year_id = y.year_id)));


create or replace view "public"."student_grades_courses_students_view" as  SELECT sg.grade_id,
    sg.student_id,
    sg.section_id,
    sg.term_id,
    sg.course_id,
    sg.grade_letter,
    sg.grade_code,
    sg.grade_percent,
    sg.gpa_points,
    sg.credit_hours_earned,
    sg.potential_credit_hours,
    sg.gpa_added_value,
    sg.exclude_from_gpa,
    sg.credit_type,
    sg.grade_status,
    sg.comment,
    sg.grade_level,
    sg.source_api,
    sg.source_updated_date,
    sg.external_source,
    sg.external_name,
    sg.external_id,
    sg.external_key,
    sg.external_key_hash,
    sg.created_at,
    sg.updated_at,
    sg.customer_id,
    c.name AS course_name,
    c.local_course_code,
    c.state_course_code,
    c.school_id,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.full_name,
    s.email,
    s.phone,
    s.gender,
    s.date_of_birth,
    s.graduation_year,
    s.enrollment_status,
    s.homeroom_name
   FROM ((student_grades sg
     JOIN students s ON ((s.student_id = sg.student_id)))
     JOIN courses c ON ((c.course_id = sg.course_id)));


create or replace view "public"."user_school_memberships_users_schools_view" as  SELECT usm.user_id,
    usm.role,
    usm.school_id,
    usm.created_at,
    usm.updated_at,
    u.first_name,
    u.middle_name,
    u.last_name,
    u.full_name,
    u.email,
    u.image_url,
    u.eula_agree_timestamp,
    s.name AS school_name
   FROM ((user_school_memberships usm
     JOIN users u ON ((u.user_id = usm.user_id)))
     LEFT JOIN schools s ON ((s.school_id = usm.school_id)));



