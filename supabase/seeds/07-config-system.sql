INSERT INTO config.configuration (config_key, value, is_secret)
SELECT 'grade_code_sort' AS config_key, '["Q1", "Q2", "S1", "Q3", "Q4", "S2"]'::jsonb AS value, false as is_secret UNION
SELECT 'final_grade_codes' AS config_key, '["S1", "S2"]'::jsonb AS value, false as is_secret;