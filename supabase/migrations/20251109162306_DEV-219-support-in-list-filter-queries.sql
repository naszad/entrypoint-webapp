create or replace view "public"."student_profiles" as  WITH school_configs AS (
         SELECT s_1.school_id,
            ( SELECT array_agg(elem.value) AS array_agg
                   FROM jsonb_array_elements_text(cfg.value) elem(value)) AS finalized_grade_codes
           FROM (( SELECT DISTINCT school_student_link.school_id
                   FROM public.school_student_link) s_1
             LEFT JOIN LATERAL ( SELECT fetch_public_config.value
                   FROM public.fetch_public_config('final_grade_code'::text, NULL::uuid, s_1.school_id, NULL::uuid) fetch_public_config(config_id, config_key, value, customer_id, school_id, user_id, created_at, updated_at)
                 LIMIT 1) cfg ON (true))
        ), gpa_results AS (
         SELECT gpa_result.student_id,
            gpa_result.gpa,
            s_1.school_id
           FROM (school_configs s_1
             JOIN LATERAL ( SELECT calculate_gpa_for_students.student_id,
                    calculate_gpa_for_students.gpa
                   FROM public.calculate_gpa_for_students(( SELECT array_agg(school_student_link.student_id) AS array_agg
                           FROM public.school_student_link
                          WHERE (school_student_link.school_id = s_1.school_id)), NULL::text, s_1.finalized_grade_codes, NULL::text[], NULL::text[]) calculate_gpa_for_students(student_id, gpa)) gpa_result ON (true))
        )
 SELECT ssl.student_id,
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
    s.customer_id,
    round(gpa_results.gpa, 2) AS gpa
   FROM ((public.school_student_link ssl
     JOIN public.students s ON ((s.student_id = ssl.student_id)))
     LEFT JOIN gpa_results ON ((gpa_results.student_id = ssl.student_id)));



