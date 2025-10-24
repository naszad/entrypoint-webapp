-- DEV-236 (follow-up): Add missing foreign key supporting indexes in config.configuration
-- Reason: Supabase performance advisory flagged FKs without a covering (leading) index.
-- Prior migration handled public schema; this adds indexes for config.configuration only.
-- Notes: Composite/unique indexes that do NOT start with the FK column don't satisfy some advisory checks.

CREATE INDEX IF NOT EXISTS idx_configuration_school_id ON config.configuration (school_id);
CREATE INDEX IF NOT EXISTS idx_configuration_user_id ON config.configuration (user_id);
-- customer_id already has leading index via idx_configuration_customer_key (customer_id, config_key); no new index added.

-- END