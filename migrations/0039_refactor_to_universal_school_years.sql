-- Custom SQL migration file, put your code below! --

-- Step 1: Create the new universal school_years table
CREATE TABLE "school_years" (
  "school_year_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text UNIQUE NOT NULL,
  "start_year" integer NOT NULL,
  "end_year" integer NOT NULL,
  "nominal_start_date" date,
  "nominal_end_date" date,
  "is_current" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 2: Migrate unique year data from years table to school_years table
-- We'll deduplicate by name since years should be universal
INSERT INTO school_years (name, start_year, end_year, is_current, created_at, updated_at)
SELECT DISTINCT 
  name,
  year_start,
  year_end,
  false, -- We'll set current year manually later
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM years
GROUP BY name, year_start, year_end
ORDER BY year_start DESC;

-- Step 3: Set the most recent year as current
UPDATE school_years 
SET is_current = true 
WHERE school_year_id = (
  SELECT school_year_id 
  FROM school_years 
  ORDER BY start_year DESC 
  LIMIT 1
);

-- Step 4: Add temporary school_year_id column to terms table
ALTER TABLE terms ADD COLUMN school_year_id uuid;

-- Step 5: Populate the school_year_id in terms based on the year name mapping
UPDATE terms 
SET school_year_id = sy.school_year_id
FROM school_years sy
JOIN years y ON sy.name = y.name
WHERE terms.year_id = y.year_id;

-- Step 6: Make school_year_id NOT NULL after population
ALTER TABLE terms ALTER COLUMN school_year_id SET NOT NULL;

-- Step 7: Add foreign key constraint for school_year_id
ALTER TABLE terms ADD CONSTRAINT "terms_school_year_id_school_years_school_year_id_fk" 
  FOREIGN KEY ("school_year_id") REFERENCES "school_years"("school_year_id") ON DELETE cascade ON UPDATE cascade;

-- Step 8: Drop the old year_id foreign key constraint and column
ALTER TABLE terms DROP CONSTRAINT "terms_year_id_years_year_id_fk";
ALTER TABLE terms DROP COLUMN year_id;

-- Step 9: Drop the old years table
DROP TABLE years;