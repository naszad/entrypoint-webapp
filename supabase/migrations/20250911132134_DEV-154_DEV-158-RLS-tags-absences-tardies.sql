create table "public"."student_daily_absences" (
    "student_daily_absence_id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "school_id" uuid not null,
    "student_id" uuid not null,
    "year_id" uuid not null,
    "absence_date" date not null,
    "external_source" text not null default 'Powerschool'::text,
    "external_name" text,
    "external_id" text not null,
    "external_key" text not null,
    "external_key_hash" text not null,
    "sis_code" text,
    "normalized_absence_code" text,
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


alter table "public"."student_daily_absences" enable row level security;

alter table "public"."student_tags" enable row level security;

alter table "public"."tag_canonical_values" enable row level security;

alter table "public"."tag_categories" enable row level security;

alter table "public"."tags" enable row level security;

CREATE UNIQUE INDEX student_daily_absences_customer_id_student_id_absence_date_uniq ON public.student_daily_absences USING btree (customer_id, student_id, absence_date);

CREATE UNIQUE INDEX student_daily_absences_external_key_hash_unique ON public.student_daily_absences USING btree (external_key_hash);

CREATE UNIQUE INDEX student_daily_absences_external_key_unique ON public.student_daily_absences USING btree (external_key);

CREATE UNIQUE INDEX student_daily_absences_pkey ON public.student_daily_absences USING btree (student_daily_absence_id);

alter table "public"."student_daily_absences" add constraint "student_daily_absences_pkey" PRIMARY KEY using index "student_daily_absences_pkey";

alter table "public"."student_daily_absences" add constraint "student_daily_absences_customer_id_customers_customer_id_fk" FOREIGN KEY (customer_id) REFERENCES customers(customer_id) not valid;

alter table "public"."student_daily_absences" validate constraint "student_daily_absences_customer_id_customers_customer_id_fk";

alter table "public"."student_daily_absences" add constraint "student_daily_absences_customer_id_student_id_absence_date_uniq" UNIQUE using index "student_daily_absences_customer_id_student_id_absence_date_uniq";

alter table "public"."student_daily_absences" add constraint "student_daily_absences_external_key_hash_unique" UNIQUE using index "student_daily_absences_external_key_hash_unique";

alter table "public"."student_daily_absences" add constraint "student_daily_absences_external_key_unique" UNIQUE using index "student_daily_absences_external_key_unique";

alter table "public"."student_daily_absences" add constraint "student_daily_absences_school_id_schools_school_id_fk" FOREIGN KEY (school_id) REFERENCES schools(school_id) not valid;

alter table "public"."student_daily_absences" validate constraint "student_daily_absences_school_id_schools_school_id_fk";

alter table "public"."student_daily_absences" add constraint "student_daily_absences_student_id_students_student_id_fk" FOREIGN KEY (student_id) REFERENCES students(student_id) not valid;

alter table "public"."student_daily_absences" validate constraint "student_daily_absences_student_id_students_student_id_fk";

alter table "public"."student_daily_absences" add constraint "student_daily_absences_year_id_years_year_id_fk" FOREIGN KEY (year_id) REFERENCES years(year_id) not valid;

alter table "public"."student_daily_absences" validate constraint "student_daily_absences_year_id_years_year_id_fk";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_student_daily_absences_and_tardies(p_student_id uuid)
 RETURNS TABLE(total_absences bigint, total_tardies bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

grant delete on table "public"."student_daily_absences" to "anon";

grant insert on table "public"."student_daily_absences" to "anon";

grant references on table "public"."student_daily_absences" to "anon";

grant select on table "public"."student_daily_absences" to "anon";

grant trigger on table "public"."student_daily_absences" to "anon";

grant truncate on table "public"."student_daily_absences" to "anon";

grant update on table "public"."student_daily_absences" to "anon";

grant delete on table "public"."student_daily_absences" to "authenticated";

grant insert on table "public"."student_daily_absences" to "authenticated";

grant references on table "public"."student_daily_absences" to "authenticated";

grant select on table "public"."student_daily_absences" to "authenticated";

grant trigger on table "public"."student_daily_absences" to "authenticated";

grant truncate on table "public"."student_daily_absences" to "authenticated";

grant update on table "public"."student_daily_absences" to "authenticated";

grant delete on table "public"."student_daily_absences" to "service_role";

grant insert on table "public"."student_daily_absences" to "service_role";

grant references on table "public"."student_daily_absences" to "service_role";

grant select on table "public"."student_daily_absences" to "service_role";

grant trigger on table "public"."student_daily_absences" to "service_role";

grant truncate on table "public"."student_daily_absences" to "service_role";

grant update on table "public"."student_daily_absences" to "service_role";

create policy "Allow Reading of Student Daily Absences"
on "public"."student_daily_absences"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_school_memberships usm
  WHERE ((usm.user_id = auth.uid()) AND (usm.school_id = student_daily_absences.school_id)))));


create policy "Allow Deleting Student Tags"
on "public"."student_tags"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = auth.uid()) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Inserting Student Tags"
on "public"."student_tags"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = auth.uid()) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Reading of Student Tags"
on "public"."student_tags"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = auth.uid()) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Updating Student Tags"
on "public"."student_tags"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN school_student_link ssl ON ((usm.school_id = ssl.school_id)))
  WHERE ((usm.user_id = auth.uid()) AND (ssl.student_id = student_tags.student_id)))));


create policy "Allow Reading of Tag Canonical Values"
on "public"."tag_canonical_values"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (tags t
     JOIN user_school_memberships usm ON ((EXISTS ( SELECT 1
           FROM schools s
          WHERE ((s.customer_id = t.customer_id) AND (s.school_id = usm.school_id))))))
  WHERE ((t.tag_id = tag_canonical_values.tag_id) AND (usm.user_id = auth.uid())))));


create policy "Allow Reading of Tag Categories"
on "public"."tag_categories"
as permissive
for select
to authenticated
using ((auth.uid() IS NOT NULL));


create policy "Allow Inserting Tags"
on "public"."tags"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN schools s ON ((usm.school_id = s.school_id)))
  WHERE ((usm.user_id = auth.uid()) AND (s.customer_id = s.customer_id)))));


create policy "Allow Reading of Tags"
on "public"."tags"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (user_school_memberships usm
     JOIN schools s ON ((usm.school_id = s.school_id)))
  WHERE ((usm.user_id = auth.uid()) AND (s.customer_id = tags.customer_id)))));



