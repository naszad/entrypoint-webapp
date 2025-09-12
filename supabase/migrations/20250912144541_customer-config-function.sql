CREATE UNIQUE INDEX idx_configuration_customer_key ON config.configuration USING btree (customer_id, config_key);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION config.set_customer_config_values(p_customer_id uuid, p_key_values jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$DECLARE
  kv RECORD;
  v jsonb;
  actual_value jsonb;
  actual_is_secret boolean := false;
BEGIN
  -- ensure no search_path surprises
  PERFORM set_config('search_path', '', true);

  -- iterate keys in the jsonb object
  FOR kv IN SELECT key, value FROM jsonb_each(p_key_values) LOOP
    v := kv.value;
    actual_value := NULL;
    actual_is_secret := false;
    -- support two formats:
    -- 1) "key": <json_value>
    -- 2) "key": { "value": <json_value>, "is_secret": true/false }
    IF v ? 'value' THEN
      actual_value := v -> 'value';
    ELSE
      actual_value := v;
    END IF;

    IF v ? 'is_secret' THEN
      actual_is_secret := (v ->> 'is_secret')::boolean;
    END IF;

    INSERT INTO config.configuration (config_id, config_key, value, is_secret, customer_id, created_at, updated_at)
    VALUES (gen_random_uuid(), kv.key, actual_value, actual_is_secret, p_customer_id, now(), now())
    ON CONFLICT (customer_id, config_key)
    DO UPDATE
    SET
      value = EXCLUDED.value,
      is_secret = EXCLUDED.is_secret,
      updated_at = now();
  END LOOP;

  RETURN;
END;$function$
;


