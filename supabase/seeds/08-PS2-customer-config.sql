-- Seed config values for the PS2 server "customer". 

begin;
-- Insert new customer, will fail if name exists
with inserted as (
  insert into public.customers (name, customer_id)
  values ('PS2 EntryPoint', 'caa3a8a2-d571-4809-8eb3-c716146c6645'::uuid)
  returning customer_id
)
-- Seed config values for the new customer
select config.set_customer_config_values(
  inserted.customer_id,
  '{
    "url": "https://powerschool2.entrypointsrm.com",
    "api_client_id": "81be4e7d-5074-452d-80af-8f8d4e730c0e",
    "api_client_secret": {"value": "4e147ce6-2b94-4575-96f4-682d7b068f53", "is_secret": true },
    "is_active": false,
    "grade_code_sort": ["Q1", "Q2", "E1", "S1", "Q3", "Q4", "E2", "S2"],
    "final_grade_code": ["S1", "S2"],
    "gpa_grade_levels": [9, 10, 11, 12]
  }'::jsonb
)
from inserted;
commit;