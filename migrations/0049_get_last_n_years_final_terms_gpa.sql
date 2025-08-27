create or replace function get_last_n_years_final_terms_gpa(
  p_student_id uuid,
  p_n int,
  p_grade_codes text[] default null
)
returns table (
  year_name text,
  grade_code text,
  gpa numeric
)
language plpgsql
as $$
declare
  v_current_end_year int;
  v_min_end_year int;
  v_grade_codes text[];
begin
  -- 1. Get current end year
  select end_year into v_current_end_year
  from public.years
  where is_current = true
  limit 1;

  if v_current_end_year is null then
    raise exception 'No current year found in years table';
  end if;

  -- 2. Compute range for past N years
  v_min_end_year := v_current_end_year - (p_n - 1);

  -- 3. Return raw rows
  return query
    select 
      y.name as year_name,
      sg.grade_code,
      round(avg(sg.gpa_points)::numeric, 2) as gpa
    from student_grades sg
    join terms t on sg.term_id = t.term_id
    join years y on t.year_id = y.year_id
    where sg.student_id = p_student_id
      and sg.grade_status = 'Final'
      and y.end_year between v_min_end_year and v_current_end_year
      and (
        p_grade_codes is null 
        or sg.grade_code = any(p_grade_codes)
      )
    group by y.name, sg.grade_code
    order by y.name, sg.grade_code;
end;
$$;
