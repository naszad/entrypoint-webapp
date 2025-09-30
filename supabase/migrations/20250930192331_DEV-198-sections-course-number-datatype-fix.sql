-- Update school_number to text
ALTER TABLE "public"."schools"
ALTER COLUMN "school_number" TYPE text
USING school_number::text;

-- Update section_number to text
ALTER TABLE "public"."sections"
ALTER COLUMN "section_number" TYPE text
USING section_number::text;

-- Add teacher_name as text
ALTER TABLE "public"."sections"
ADD COLUMN IF NOT EXISTS "teacher_name" text;
