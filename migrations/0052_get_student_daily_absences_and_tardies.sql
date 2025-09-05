create or replace function get_student_daily_absences_and_tardies(
  p_student_id uuid
)
returns table (
  total_absences bigint,
  total_tardies bigint
)
language plpgsql
as $$
declare
  v_current_year_id uuid;
begin
  -- 1. Get current school year ID
  select year_id into v_current_year_id
  from public.years
  where is_current = true
  limit 1;

  if v_current_year_id is null then
    raise exception 'No current year found in years table';
  end if;

  -- 2. Return total absences and tardies for the current school year
  return query
    select 
      -- Total absences: count of records in student_daily_absences for current year
      coalesce((
        select count(*)
        from public.student_daily_absences sda
        where sda.student_id = p_student_id
          and sda.year_id = v_current_year_id
      ), 0)::bigint as total_absences,
      
      -- Total tardies: sum of tardies from section_enrollments for current year terms
      coalesce((
        select sum(se.tardies)
        from public.section_enrollments se
        join public.terms t on se.term_id = t.term_id
        where se.student_id = p_student_id
          and t.year_id = v_current_year_id
          and se.tardies > 0
      ), 0)::bigint as total_tardies;
end;
$$;