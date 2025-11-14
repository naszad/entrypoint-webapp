drop view if exists views.course_enrollments;
drop materialized view if exists views_cache.course_enrollments;

drop index if exists views_cache_course_enrollments_uq;
drop index if exists views_cache_course_enrollments_current_idx;
drop index if exists views_cache_course_enrollments_course_idx;

create materialized view views_cache.course_enrollments as
with
  scoped_enrollments as (
    select
      se_1.section_enrollment_id,
      se_1.student_id,
      se_1.section_id,
      se_1.term_id,
      se_1.start_date,
      se_1.end_date,
      se_1.transaction_date,
      se_1.created_at,
      se_1.updated_at,
      se_1.customer_id as enrollment_customer_id,
      s.course_id,
      s.section_number,
      s.course_number,
      s.grade_level as section_grade_level,
      s.teacher_name,
      s.no_of_students,
      s.customer_id as section_customer_id,
      COALESCE(s.school_id, c.school_id) as school_id,
      c.name as course_name,
      c.local_course_code,
      c.state_course_code,
      c.credit_type,
      c.customer_id as course_customer_id
    from
      section_enrollments se_1
      join sections s on s.section_id = se_1.section_id
      join courses c on c.course_id = s.course_id
  )
select
  se.section_enrollment_id,
  se.student_id,
  se.section_id,
  se.course_id,
  se.term_id,
  se.school_id,
  sch.name as school_name,
  COALESCE(
    st.customer_id,
    sch.customer_id,
    se.enrollment_customer_id,
    se.section_customer_id,
    se.course_customer_id
  ) as customer_id,
  st.full_name as student_full_name,
  st.grade_level as student_grade_level,
  st.enrollment_status as student_enrollment_status,
  st.student_number,
  st.state_student_number,
  se.course_name,
  se.course_number,
  se.local_course_code,
  se.state_course_code,
  se.credit_type,
  se.section_number,
  se.section_grade_level,
  se.teacher_name,
  se.start_date as enrollment_start_date,
  se.end_date as enrollment_end_date,
  se.transaction_date,
  se.created_at,
  se.updated_at,
  t.abbreviation as term_abbreviation,
  t.start_date as term_start_date,
  t.end_date as term_end_date,
  y.year_id,
  y.name as year_name,
  y.start_year as year_start_year,
  y.end_year as year_end_year,
  y.is_current as is_current_year,
  case
    when (
      se.start_date <= CURRENT_DATE
    )
    and (
      se.end_date >= CURRENT_DATE
    ) then true
    else false
  end as is_current_enrollment
from
  scoped_enrollments se
  join students st on st.student_id = se.student_id
  left join schools sch on sch.school_id = se.school_id
  left join terms t on t.term_id = se.term_id
  left join years y on y.year_id = t.year_id
where
  se.school_id is not null;
  
CREATE UNIQUE INDEX views_cache_course_enrollments_uq ON views_cache.course_enrollments USING btree (section_enrollment_id);
CREATE INDEX views_cache_course_enrollments_current_idx ON views_cache.course_enrollments USING btree (school_id, student_id, is_current_enrollment);
CREATE INDEX views_cache_course_enrollments_course_idx ON views_cache.course_enrollments USING btree (school_id, course_id);

create view views.course_enrollments as
select
  section_enrollment_id,
  student_id,
  section_id,
  course_id,
  term_id,
  school_id,
  school_name,
  customer_id,
  student_full_name,
  student_grade_level,
  student_enrollment_status,
  student_number,
  state_student_number,
  course_name,
  course_number,
  local_course_code,
  state_course_code,
  credit_type,
  section_number,
  section_grade_level,
  teacher_name,
  enrollment_start_date,
  enrollment_end_date,
  transaction_date,
  created_at,
  updated_at,
  term_abbreviation,
  term_start_date,
  term_end_date,
  year_id,
  year_name,
  year_start_year,
  year_end_year,
  is_current_year,
  is_current_enrollment
from
  views_cache.course_enrollments
where
  get_current_school_id () is null
  or school_id = get_current_school_id ();