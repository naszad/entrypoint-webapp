-- Extend student-facing analytics views with a boolean enrollment flag so
-- consumers can reliably restrict results to active students without relying
-- on free-form status strings.

-- student_profiles -----------------------------------------------------------
DROP VIEW IF EXISTS views.student_profiles;
DROP MATERIALIZED VIEW IF EXISTS views_cache.student_profiles;

CREATE MATERIALIZED VIEW views_cache.student_profiles AS
WITH school_configs AS (
    SELECT
        ssl.school_id,
        (
            SELECT ARRAY_AGG(elem.value) AS finalized_grade_codes
            FROM JSONB_ARRAY_ELEMENTS_TEXT(cfg.value) AS elem(value)
        )
    FROM (
        SELECT DISTINCT ssl_inner.school_id
        FROM public.school_student_link AS ssl_inner
        WHERE ssl_inner.school_id IS NOT NULL
    ) AS ssl
    LEFT JOIN LATERAL (
        SELECT fetch_public_config.value
        FROM public.fetch_public_config(
            'final_grade_code',
            NULL::UUID,
            ssl.school_id,
            NULL::UUID
        ) AS fetch_public_config(
            config_id,
            config_key,
            value,
            customer_id,
            school_id,
            user_id,
            created_at,
            updated_at
        )
        LIMIT 1
    ) AS cfg ON TRUE
),
gpa_results AS (
    SELECT
        sc.school_id,
        gpa_calc.student_id,
        gpa_calc.gpa
    FROM school_configs AS sc
    JOIN LATERAL (
        SELECT calc.student_id, calc.gpa
        FROM public.calculate_gpa_for_students(
            (
                SELECT ARRAY_AGG(DISTINCT ssl.student_id)
                FROM public.school_student_link AS ssl
                WHERE ssl.school_id = sc.school_id
            ),
            NULL::TEXT,
            sc.finalized_grade_codes,
            NULL::TEXT[],
            NULL::TEXT[],
            NULL::INTEGER[]
        ) AS calc(student_id, gpa)
    ) AS gpa_calc ON TRUE
    WHERE gpa_calc.student_id IS NOT NULL
),
scoped_links AS (
    SELECT
        ssl.student_id,
        ssl.school_id,
        ssl.start_date,
        ssl.end_date,
        ssl.created_at,
        ssl.updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY ssl.student_id,
                         ssl.school_id,
                         COALESCE(ssl.start_date, '-infinity'::DATE),
                         COALESCE(ssl.end_date, 'infinity'::DATE)
            ORDER BY COALESCE(ssl.updated_at, ssl.created_at) DESC,
                     ssl.created_at DESC
        ) AS row_rank
    FROM public.school_student_link AS ssl
    WHERE ssl.school_id IS NOT NULL
)
SELECT
    st.student_id,
    sl.school_id,
    sc.name AS school_name,
    COALESCE(sc.customer_id, st.customer_id) AS customer_id,
    gpa_results.gpa,
    st.full_name,
    st.first_name,
    st.middle_name,
    st.last_name,
    st.grade_level,
    st.enrollment_status,
    CASE WHEN st.enrollment_status = 'Active' THEN TRUE ELSE FALSE END AS is_student_active,
    st.homeroom_name,
    st.graduation_year,
    st.student_number,
    st.state_student_number,
    st.lunch_id,
    st.gender,
    st.date_of_birth,
    st.race,
    st.email,
    st.phone,
    st.address_physical_street,
    st.address_physical_city,
    st.address_physical_state,
    st.address_physical_postal_code,
    st.address_mailing_street,
    st.address_mailing_city,
    st.address_mailing_state,
    st.address_mailing_postal_code,
    st.locker_number,
    st.locker_combination,
    st.created_at,
    st.updated_at,
    sl.start_date AS school_start_date,
    sl.end_date AS school_end_date,
    sc.city AS school_city,
    sc.state AS school_state,
    COALESCE(sl.start_date, '0001-01-01'::DATE) AS school_start_key,
    COALESCE(sl.end_date, '9999-12-31'::DATE) AS school_end_key
FROM public.students AS st
LEFT JOIN scoped_links AS sl ON sl.student_id = st.student_id AND sl.row_rank = 1
LEFT JOIN public.schools AS sc ON sc.school_id = sl.school_id
LEFT JOIN gpa_results ON gpa_results.student_id = st.student_id AND gpa_results.school_id = sl.school_id
WHERE sl.school_id IS NOT NULL;

CREATE UNIQUE INDEX views_cache_student_profiles_uq
    ON views_cache.student_profiles USING btree (student_id, school_id, school_start_key, school_end_key);
CREATE INDEX views_cache_student_profiles_school_grade_idx
    ON views_cache.student_profiles USING btree (school_id, grade_level);
CREATE INDEX views_cache_student_profiles_school_status_idx
    ON views_cache.student_profiles USING btree (school_id, enrollment_status);

CREATE VIEW views.student_profiles AS
SELECT
    student_id,
    school_id,
    school_name,
    customer_id,
    gpa,
    full_name,
    first_name,
    middle_name,
    last_name,
    grade_level,
    enrollment_status,
    is_student_active,
    homeroom_name,
    graduation_year,
    student_number,
    state_student_number,
    lunch_id,
    gender,
    date_of_birth,
    race,
    email,
    phone,
    address_physical_street,
    address_physical_city,
    address_physical_state,
    address_physical_postal_code,
    address_mailing_street,
    address_mailing_city,
    address_mailing_state,
    address_mailing_postal_code,
    locker_number,
    locker_combination,
    created_at,
    updated_at,
    school_start_date,
    school_end_date,
    school_city,
    school_state
FROM views_cache.student_profiles
WHERE public.get_current_school_id() IS NULL OR school_id = public.get_current_school_id();

COMMENT ON COLUMN views_cache.student_profiles.is_student_active IS 'Boolean helper based on students.enrollment_status; true when the student is Active, false otherwise.';
COMMENT ON VIEW views.student_profiles IS 'Core information about students: name, gpa, grade level, graduation year, etc.';
COMMENT ON COLUMN views.student_profiles.gpa IS 'The student''s cumulative Grade Point Average (GPA) across all completed courses.';
COMMENT ON COLUMN views.student_profiles.grade_level IS 'The current grade level of the student, e.g. 9, 10, 11 etc.';
COMMENT ON COLUMN views.student_profiles.graduation_year IS 'The expected graduation year of the student, e.g. 2024, 2025 etc.';
COMMENT ON COLUMN views.student_profiles.enrollment_status IS 'The current enrollment status of the student; will be Active for any currently enrolled student.';
COMMENT ON COLUMN views.student_profiles.student_number IS 'The user-facing numeric identifier for the student, often assigned by the school''s SIS. Sometimes referred to as a Student ID (not to be confused with our internal hidden identifier, student_id).';
COMMENT ON COLUMN views.student_profiles.is_student_active IS 'Boolean helper for determining if the student is Active; derived from students.enrollment_status.';

-- student_grades -------------------------------------------------------------
DROP VIEW IF EXISTS views.student_grades;
DROP MATERIALIZED VIEW IF EXISTS views_cache.grades;

CREATE MATERIALIZED VIEW views_cache.grades AS
WITH scoped_grades AS (
    SELECT
        sg.grade_id,
        sg.student_id,
        sg.section_id,
        sg.term_id,
        sg.course_id,
        sg.grade_letter,
        sg.grade_code,
        sg.grade_percent,
        sg.gpa_points,
        sg.credit_hours_earned,
        sg.credit_type,
        sg.grade_status,
        sg.comment AS grade_comment,
        sg.grade_level,
        sg.source_api,
        sg.source_updated_date,
        sg.created_at,
        sg.updated_at,
        sg.customer_id AS sg_customer_id,
        sg.potential_credit_hours,
        sg.gpa_added_value,
        sg.exclude_from_gpa,
        s.section_number,
        s.course_number,
        s.grade_level AS section_grade_level,
        s.teacher_name,
        c.course_id AS joined_course_id,
        c.name AS course_name,
        c.local_course_code,
        c.state_course_code,
        c.school_id,
        c.customer_id AS course_customer_id,
        t.term_id AS joined_term_id,
        t.abbreviation AS term_abbreviation,
        t.start_date AS term_start_date,
        t.end_date AS term_end_date,
        y.year_id,
        y.name AS year_name,
        y.start_year,
        y.end_year,
        CASE WHEN st.enrollment_status = 'Active' THEN TRUE ELSE FALSE END AS is_student_active,
        ROW_NUMBER() OVER (
            PARTITION BY sg.student_id,
                         sg.section_id,
                         COALESCE(sg.grade_code, ''),
                         COALESCE(sg.grade_status, '')
            ORDER BY COALESCE(sg.source_updated_date::TIMESTAMPTZ, sg.updated_at, sg.created_at) DESC,
                     sg.updated_at DESC,
                     sg.created_at DESC,
                     sg.grade_id DESC
        ) AS row_rank
    FROM public.student_grades AS sg
    JOIN public.sections AS s ON s.section_id = sg.section_id
    JOIN public.courses AS c ON c.course_id = s.course_id
    LEFT JOIN public.terms AS t ON t.term_id = sg.term_id
    LEFT JOIN public.years AS y ON y.year_id = t.year_id
    LEFT JOIN public.students AS st ON st.student_id = sg.student_id
)
SELECT
    grade_id,
    student_id,
    section_id,
    COALESCE(term_id, joined_term_id) AS term_id,
    COALESCE(course_id, joined_course_id) AS course_id,
    school_id,
    COALESCE(sg_customer_id, course_customer_id) AS customer_id,
    course_name,
    course_number,
    local_course_code,
    state_course_code,
    section_number,
    section_grade_level,
    teacher_name,
    grade_letter,
    grade_code,
    grade_percent,
    gpa_points,
    credit_hours_earned,
    credit_type,
    grade_status,
    is_student_active,
    grade_comment,
    grade_level AS grade_level_reported,
    source_api,
    source_updated_date,
    created_at,
    updated_at,
    potential_credit_hours,
    gpa_added_value,
    exclude_from_gpa,
    term_abbreviation,
    term_start_date,
    term_end_date,
    year_id,
    year_name,
    start_year AS year_start_year,
    end_year AS year_end_year
FROM scoped_grades
WHERE row_rank = 1;

CREATE UNIQUE INDEX views_cache_grades_uq
    ON views_cache.grades USING btree (grade_id);
CREATE INDEX views_cache_grades_student_course_idx
    ON views_cache.grades USING btree (student_id, course_id);
CREATE INDEX views_cache_grades_school_year_status_idx
    ON views_cache.grades USING btree (school_id, year_id, grade_status);

CREATE VIEW views.student_grades AS
SELECT
    grade_id,
    student_id,
    section_id,
    term_id,
    course_id,
    school_id,
    customer_id,
    course_name,
    course_number,
    local_course_code,
    state_course_code,
    section_number,
    section_grade_level,
    teacher_name,
    grade_letter,
    grade_code,
    grade_percent,
    gpa_points,
    credit_hours_earned,
    credit_type,
    grade_status,
    is_student_active,
    grade_comment,
    grade_level_reported,
    source_api,
    source_updated_date,
    created_at,
    updated_at,
    potential_credit_hours,
    gpa_added_value,
    exclude_from_gpa,
    term_abbreviation,
    term_start_date,
    term_end_date,
    year_id,
    year_name,
    year_start_year,
    year_end_year
FROM views_cache.grades
WHERE school_id IS NOT NULL
  AND (public.get_current_school_id() IS NULL OR school_id = public.get_current_school_id());

COMMENT ON COLUMN views_cache.grades.is_student_active IS 'Boolean helper based on students.enrollment_status; true when the student is Active, false otherwise.';
COMMENT ON VIEW views.student_grades IS 'Student grade records for individual classes/sections. Do not use the grade point data on this view directly, it can only be used as part of GPA calc functions.';
COMMENT ON COLUMN views.student_grades.section_grade_level IS 'The grade level this course section is for, e.g. 9, 10, 11 etc.';
COMMENT ON COLUMN views.student_grades.potential_credit_hours IS 'The number of credit hours that can be earned by the student taking this course when completed.';
COMMENT ON COLUMN views.student_grades.gpa_points IS 'The grade points the student earned for this course section, e.g. 4.0 for an A, 3.0 for a B etc. Do not use this column directly, it is only useful as part of GPA calculation functions.';
COMMENT ON COLUMN views.student_grades.grade_letter IS 'The letter grade the student earned for this grade code/term in this course section, e.g. A, B, C, etc.';
COMMENT ON COLUMN views.student_grades.grade_percent IS 'The numeric percentage grade the student earned for this grade code/term in this course section, e.g. 92.5 for 92.5%.';
COMMENT ON COLUMN views.student_grades.grade_code IS 'The code for this grade record, e.g. Q1, S1, E2, etc. Defines the scope/meaning of the grade. Possible values are dependent on the school.';
COMMENT ON COLUMN views.student_grades.term_abbreviation IS 'The short name for the term (e.g. semester, quarter) this grade is associated with, e.g. Q1, S2, etc. Often matches the grade_code but not always.';
COMMENT ON COLUMN views.student_grades.is_student_active IS 'Boolean helper for determining if the student tied to this grade is Active; derived from students.enrollment_status.';

-- student_tags ---------------------------------------------------------------
DROP VIEW IF EXISTS views.student_tags;
DROP MATERIALIZED VIEW IF EXISTS views_cache.student_tags;

CREATE MATERIALIZED VIEW views_cache.student_tags AS
WITH ranked_links AS (
    SELECT
        ssl.student_id,
        ssl.school_id,
        ssl.start_date,
        ssl.end_date,
        ssl.created_at,
        ssl.updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY ssl.student_id
            ORDER BY
                CASE
                    WHEN (ssl.start_date IS NULL OR ssl.start_date <= CURRENT_DATE)
                         AND (ssl.end_date IS NULL OR ssl.end_date >= CURRENT_DATE)
                    THEN 0
                    ELSE 1
                END,
                COALESCE(ssl.updated_at, ssl.created_at) DESC,
                ssl.created_at DESC
        ) AS row_rank
    FROM public.school_student_link AS ssl
    WHERE ssl.school_id IS NOT NULL
),
current_links AS (
    SELECT
        ranked_links.student_id,
        ranked_links.school_id
    FROM ranked_links
    WHERE ranked_links.row_rank = 1
),
 tagged_students AS (
    SELECT
        stg.student_tag_id,
        stg.student_id,
        stg.tag_id,
        stg.value,
        stg.canonical_value_id,
        stg.source,
        stg.created_by_user_id,
        stg.updated_by_user_id,
        stg.created_at,
        stg.updated_at,
        cl.school_id
    FROM public.student_tags AS stg
    JOIN current_links AS cl ON cl.student_id = stg.student_id
)
SELECT
    ts.student_tag_id,
    ts.student_id,
    ts.tag_id,
    ts.canonical_value_id,
    COALESCE(st.customer_id, sch.customer_id, tg.customer_id) AS customer_id,
    tg.name AS tag_name,
    tg.is_multi_value,
    tg.tag_category_id,
    tc.name AS tag_category_name,
    ts.value,
    ts.source,
    tcv.value AS canonical_value,
    tcv.search_key_words AS canonical_search_key_words,
    ts.created_at,
    ts.updated_at,
    ts.created_by_user_id,
    ts.updated_by_user_id,
    st.full_name AS student_full_name,
    st.grade_level AS student_grade_level,
    st.enrollment_status AS student_enrollment_status,
    CASE WHEN st.enrollment_status = 'Active' THEN TRUE ELSE FALSE END AS is_student_active,
    st.student_number,
    st.state_student_number,
    ts.school_id
FROM tagged_students AS ts
JOIN public.students AS st ON st.student_id = ts.student_id
LEFT JOIN public.schools AS sch ON sch.school_id = ts.school_id
LEFT JOIN public.tags AS tg ON tg.tag_id = ts.tag_id
LEFT JOIN public.tag_categories AS tc ON tc.tag_category_id = tg.tag_category_id
LEFT JOIN public.tag_canonical_values AS tcv ON tcv.tag_canonical_value_id = ts.canonical_value_id
LEFT JOIN public.users AS creator ON creator.user_id = ts.created_by_user_id
LEFT JOIN public.users AS editor ON editor.user_id = ts.updated_by_user_id
WHERE ts.school_id IS NOT NULL;

CREATE UNIQUE INDEX views_cache_student_tags_uq
    ON views_cache.student_tags USING btree (student_tag_id);
CREATE INDEX views_cache_student_tags_school_tag_idx
    ON views_cache.student_tags USING btree (school_id, tag_id);
CREATE INDEX views_cache_student_tags_school_student_idx
    ON views_cache.student_tags USING btree (school_id, student_id);

CREATE VIEW views.student_tags AS
SELECT
    student_tag_id,
    student_id,
    tag_id,
    canonical_value_id,
    customer_id,
    tag_name,
    is_multi_value,
    tag_category_id,
    tag_category_name,
    value,
    source,
    canonical_value,
    canonical_search_key_words,
    created_at,
    updated_at,
    created_by_user_id,
    updated_by_user_id,
    student_full_name,
    student_grade_level,
    student_enrollment_status,
    is_student_active,
    student_number,
    state_student_number,
    school_id
FROM views_cache.student_tags
WHERE public.get_current_school_id() IS NULL OR school_id = public.get_current_school_id();

COMMENT ON COLUMN views_cache.student_tags.is_student_active IS 'Boolean helper based on students.enrollment_status; true when the student is Active, false otherwise.';
COMMENT ON COLUMN views.student_tags.tag_name IS 'The name of the tag assigned to the student. If this is a multi-value tag, the student may have multiple records with the same tag name but different values.';
COMMENT ON COLUMN views.student_tags.tag_category_name IS 'The category this tag belongs to, e.g. "Goals", "Extracurriculars", etc. Exists to provide context for the tag and for grouping.';
COMMENT ON COLUMN views.student_tags.value IS 'The value associated with the tag for the student. This is used when a tag can have multiple values.';
COMMENT ON COLUMN views.student_tags.canonical_value IS 'The standardized canonical value for the tag, if applicable. This helps with consistent reporting and searching across similar tag values.';
COMMENT ON COLUMN views.student_tags.is_multi_value IS 'Indicates whether the tag is one that has a value, or (if false) is a boolean tag (the student either has the tag, or does not).';
COMMENT ON COLUMN views.student_tags.student_number IS 'The user-facing numeric student identifier.';
COMMENT ON COLUMN views.student_tags.is_student_active IS 'Boolean helper for determining if the tagged student is Active; derived from students.enrollment_status.';
