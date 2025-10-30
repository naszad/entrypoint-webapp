-- 1. Create new schema if not exists
CREATE SCHEMA IF NOT EXISTS logs;

-- 2. Revoke public access
REVOKE ALL ON SCHEMA logs FROM PUBLIC;

-- 3. Move existing table to new schema (if it exists)
ALTER TABLE IF EXISTS public.pipeline_error_log SET SCHEMA logs;

-- 4. Ensure unique index on id
DO LANGUAGE plpgsql $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'logs' AND indexname = 'pipeline_error_log_pkey'
    ) THEN
        CREATE UNIQUE INDEX pipeline_error_log_pkey ON logs.pipeline_error_log (id);
    END IF;
END $$;

-- 5. Add primary key constraint if missing
DO LANGUAGE plpgsql $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'logs'
          AND table_name = 'pipeline_error_log'
          AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE logs.pipeline_error_log ADD CONSTRAINT pipeline_error_log_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- 6. Add index on customer_id
CREATE INDEX IF NOT EXISTS pipeline_error_log_customer_id_idx
    ON logs.pipeline_error_log (customer_id);

-- 7. Restrict anon access
REVOKE ALL ON SCHEMA logs FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA logs FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA logs FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA logs FROM anon;
