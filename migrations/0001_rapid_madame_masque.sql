ALTER TABLE "school_student_link" RENAME COLUMN "external_student_id" TO "external_student_key_hash";--> statement-breakpoint
ALTER TABLE "school_student_link" RENAME COLUMN "external_school_id" TO "external_school_key_hash";--> statement-breakpoint
ALTER TABLE "user_school_memberships" RENAME COLUMN "school_id" TO "school_key_hash";--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_school_id_schools_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_school_id_schools_id_fk";

DROP POLICY "Allow Reading of Schools" ON "schools";
DROP POLICY "Allow Reading of Students" ON students;

--> statement-breakpoint
ALTER TABLE "schools" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "schools" DROP COLUMN "school_id";--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "school_id" uuid;--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "school_id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "external_id" SET DATA TYPE integer USING external_id::integer;--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "external_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "student_id";
ALTER TABLE "students" ADD COLUMN "student_id" uuid PRIMARY KEY DEFAULT gen_random_uuid();--> statement-breakpoint

-- Step 1: Add a new temporary integer column (nullable)
ALTER TABLE "students" ADD COLUMN "school_id_int" integer;
-- Step 2: Populate it (you must define a way to convert UUID -> integer)
UPDATE "students" SET "school_id_int" = NULL; -- or any logic here
-- Step 3: Drop old UUID column
ALTER TABLE "students" DROP COLUMN "school_id";
-- Step 4: Rename new column to original name
ALTER TABLE "students" RENAME COLUMN "school_id_int" TO "school_id";
-- Step 5: Add NOT NULL constraint if needed
ALTER TABLE "students" ALTER COLUMN "school_id" SET NOT NULL; -- only if sure no nulls exist

ALTER TABLE "students" ALTER COLUMN "external_id" SET DATA TYPE integer USING external_id::integer;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "external_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD PRIMARY KEY ("school_id");--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "external_key_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "external_key_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE POLICY "Allow Reading of Schools" ON "schools"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_school_memberships usm
      WHERE usm.user_id = auth.uid()
        AND usm.school_key_hash = "schools"."external_key_hash"
    )
  );

CREATE POLICY "Allow Reading of Students" ON students TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM user_school_memberships AS usm
    JOIN school_student_link       AS ssl
      ON usm.school_key_hash = ssl.external_school_key_hash
    WHERE usm.user_id = auth.uid()
      AND ssl.external_student_key_hash = students.external_key_hash
  )
);
