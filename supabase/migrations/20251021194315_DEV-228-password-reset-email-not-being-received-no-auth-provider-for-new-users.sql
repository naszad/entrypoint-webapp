set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_email_domain_whitelisted(p_email_domain text, p_school_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
declare
  v_customer_id uuid;
  v_whitelist jsonb;
  v_is_whitelisted boolean := false;
begin
  -- Step 1: Get customer_id for the school
  select customer_id into v_customer_id
  from public.schools
  where school_id = p_school_id;

  if v_customer_id is null then
    -- Invalid school_id: return false (no match)
    return false;
  end if;

  -- Step 2: Get whitelist config
  select value into v_whitelist
  from public.public_configuration
  where config_key = 'email_domain_whitelist'
    and customer_id = v_customer_id;

  -- Step 3: Check if domain exists in whitelist array
  if v_whitelist is not null then
    select exists (
      select 1
      from jsonb_array_elements_text(v_whitelist) as domains
      where lower(domains) = lower(p_email_domain)
    )
    into v_is_whitelisted;
  end if;

  -- Step 4: Return boolean result
  return coalesce(v_is_whitelisted, false);
end;
$function$
;


