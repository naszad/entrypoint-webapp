# Customer Setup Workflow

Use the `config.add_customer` function to provision a new customer together with their initial configuration values. The helper handles customer creation, applies the required lowercase `shortname`, and writes any optional configuration that you provide.

## Required Inputs

- `p_name`: Full display name for the customer (e.g. `"Some School District"`).
- `p_shortname`: Lowercase slug for the customer. The function lowercases whatever you pass before inserting.

## Optional Configuration Parameters

Leave arguments `NULL` to skip any values:

- `p_url`
- `p_api_client_id`
- `p_api_client_secret` (stored as a secret automatically)
- `p_email_domain_whitelist` (`text[]`)
- `p_final_grade_codes` (`text[]`)
- `p_grade_code_sort` (`text[]`)
- `p_gpa_grade_levels` (`integer[]`)
- `p_is_active` (defaults to `false` when omitted)

## Example Seed Script

```sql
begin;

select config.add_customer(
  p_name                   => 'Example District',
  p_shortname              => 'exampledistrict',
  p_url                    => 'https://ps.exampledistrict.edu',
  p_api_client_id          => '12345678-abcd-4321-abcd-1234567890ab',
  p_api_client_secret      => 'super-secret-client-secret-value',
  p_email_domain_whitelist => array['exampledistrict.edu', 'students.exampledistrict.edu'],
  p_final_grade_codes      => array['S1', 'S2'],
  p_grade_code_sort        => array['Q1', 'Q2', 'E1', 'S1', 'Q3', 'Q4', 'E2', 'S2'],
  p_gpa_grade_levels       => array[9, 10, 11, 12],
  p_is_active              => true
);

commit;
```

## Notes

- The function grants execute permissions to the `service_role`. Apply additional grants as needed for your deployment.
- `p_is_active` is always written; when omitted the customer starts inactive.
- Existing customers retain a `NULL` `shortname` until you backfill and enforce the not-null constraint in a follow-up migration.
