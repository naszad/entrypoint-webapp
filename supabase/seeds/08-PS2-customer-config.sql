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



INSERT INTO schools
  (name, external_source, external_key, external_id, external_key_hash, school_number, customer_id)
  values
  (
    'District Office',
    'PowerSchool',
    'ps:caa3a8a2-d571-4809-8eb3-c716146c6645:0',
    '0',
    'c9dd4c93ed3eb558b6f8f9f1d638776f40739d0d34d60bb9e309a6542a8042db66b64de83b620cbb4cd9a2371c81befac5aebc06f067d194a9a21c5bcec85a56',
    '0',
    'caa3a8a2-d571-4809-8eb3-c716146c6645'::uuid
    
  );

INSERT INTO schools
  (name, external_source, external_key, external_id, external_key_hash, school_number, customer_id)
  values
  (
    'Graduated',
    'PowerSchool',
    'ps:caa3a8a2-d571-4809-8eb3-c716146c6645:999999',
    '999999',
    'efa4287004987790b19459ee019f2fa8263500bc99828ce0ed2e342917e48d951ffab403b9d38f04c1f7bb3f0fcb47b271cc6a8f979287a72e4016a30c24fc0d',
    '999999',
    'caa3a8a2-d571-4809-8eb3-c716146c6645'::uuid
  );

