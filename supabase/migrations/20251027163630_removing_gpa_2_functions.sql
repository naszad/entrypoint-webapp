drop function if exists "public"."calculate_added_value_gpa_2"(p_student_id uuid, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[]);

drop function if exists "public"."calculate_credit_hour_weighted_gpa_2"(p_student_id uuid, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[]);

drop function if exists "public"."calculate_gpa_dispatch_2"(p_student_id uuid, p_method text, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[]);

drop function if exists "public"."calculate_gpa_for_students_2"(p_student_ids uuid[], p_method text, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[]);

drop function if exists "public"."calculate_gpa_for_students_2"(p_student_ids uuid[], p_method text, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[], p_customer_id uuid);

drop function if exists "public"."calculate_simple_gpa_2"(p_student_id uuid, p_grade_codes text[], p_credit_types text[], p_year_labels text[], p_grade_levels integer[]);


