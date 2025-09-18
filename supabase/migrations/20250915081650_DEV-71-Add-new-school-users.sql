alter table "public"."users" add column "full_name" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_user_with_membership(p_email text, p_encrypted_password text, p_first_name text, p_last_name text, p_school_id uuid, p_membership_role text DEFAULT 'user'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_auth_user_id uuid;
  v_customer_id uuid;
  v_whitelist jsonb;
  v_domain text;
begin
  -- Step 0: Extract email domain
  v_domain := lower(split_part(p_email, '@', 2));

  -- Step 1: Get customer_id for the school
  select customer_id into v_customer_id
  from public.schools
  where school_id = p_school_id;

  if v_customer_id is null then
    raise exception 'Invalid school_id: %', p_school_id
      using hint = 'No matching school found';
  end if;

  -- Step 2: Get whitelist config
  select value into v_whitelist
  from public.public_configuration
  where config_key = 'email_domain_whitelist'
  and customer_id = v_customer_id;

  -- Step 3: Validate whitelist
  if v_whitelist is null 
     or not exists (
       select 1
       from jsonb_array_elements_text(v_whitelist) as domains
       where lower(domains) = v_domain
     )
  then
    raise exception 'Email domain is not whitelisted'
      using hint = 'Allowed domains are configured per customer';
  end if;

  -- Step 4: Check if auth user exists
  select id into v_auth_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_auth_user_id is null then
    insert into auth.users (
      id, email, encrypted_password, aud, role, email_confirmed_at, created_at
    )
    values (
      gen_random_uuid(),
      lower(p_email),
      p_encrypted_password,
      'authenticated',
      'authenticated',
      now(),
      now()
    )
    returning id into v_auth_user_id;
  end if;

  -- Step 5: Ensure public user exists
  if not exists (
    select 1 from public.users
    where auth_user_id = v_auth_user_id
  ) then
    insert into public.users (
      user_id,
      auth_user_id,
      first_name,
      last_name,
      full_name,
      email
    )
    values (
      v_auth_user_id,
      v_auth_user_id,
      p_first_name,
      p_last_name,
      p_first_name || ' ' || p_last_name,
      lower(p_email)
    );
  end if;

  -- Step 6: Insert membership if not exists
  insert into public.user_school_memberships (
    user_id,
    school_id,
    role,
    created_at,
    updated_at
  )
  values (
    v_auth_user_id,
    p_school_id,
    p_membership_role,
    now(),
    now()
  )
  on conflict (user_id, school_id) do nothing;

  -- Step 7: Return user_id
  return v_auth_user_id;

end;
$function$
;
