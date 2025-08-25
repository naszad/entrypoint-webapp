create or replace view public_configuration as
select config_id, config_key, value, customer_id, school_id, user_id, created_at, updated_at
from config.configuration
where is_secret = false;