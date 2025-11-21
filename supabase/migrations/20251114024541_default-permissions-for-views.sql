-- This ensures that any views created in the 'views' schema in the future will
-- have the appropriate default permissions for the 'authenticated' role.

GRANT USAGE ON SCHEMA views TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA views TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA views GRANT SELECT ON TABLES TO authenticated;