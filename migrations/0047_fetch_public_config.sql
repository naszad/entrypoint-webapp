create or replace function fetch_public_config(
  p_config_key text,
  p_user_id uuid default null,
  p_school_id uuid default null,
  p_customer_id uuid default null
)
returns setof public_configuration as $$
declare
  v_school_id uuid;
  v_customer_id uuid;
begin
  if p_user_id is not null then
    select school_id
    into v_school_id
    from user_school_memberships
    where user_id = p_user_id
    limit 1;
  end if;

  if p_school_id is not null or v_school_id is not null then
    select customer_id
    into v_customer_id
    from schools
    where school_id = coalesce(p_school_id, v_school_id)
    limit 1;
  end if;

  if p_customer_id is not null then
    v_customer_id := p_customer_id;
  end if;

  return query
  select config_id, config_key, value, customer_id, school_id, user_id, created_at, updated_at
  from public_configuration pc
  where pc.config_key = p_config_key
    and (
      (p_user_id is not null and pc.user_id = p_user_id)
      or (coalesce(p_school_id, v_school_id) is not null and pc.school_id = coalesce(p_school_id, v_school_id) and pc.user_id is null)
      or (v_customer_id is not null and pc.customer_id = v_customer_id and pc.school_id is null and pc.user_id is null)
      or (pc.user_id is null and pc.school_id is null and pc.customer_id is null)
    )
  order by
    case
      when pc.user_id is not null then 1
      when pc.school_id is not null then 2
      when pc.customer_id is not null then 3
      else 4
    end
  limit 1;
end;
$$ language plpgsql stable;
