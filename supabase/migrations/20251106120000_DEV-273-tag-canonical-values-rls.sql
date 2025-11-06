-- DEV-273 ensure authenticated users can add canonical values for tags in their customer scope
create policy "Allow inserting tag canonical values"
  on public.tag_canonical_values
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tags t
      join public.user_school_memberships usm on usm.user_id = auth.uid()
      join public.schools s on s.school_id = usm.school_id
      where t.tag_id = tag_canonical_values.tag_id
        and t.customer_id = s.customer_id
    )
  );
