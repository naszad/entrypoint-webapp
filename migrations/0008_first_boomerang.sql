CREATE TABLE "courses" (
	"course_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_key" text NOT NULL,
	"external_id" text NOT NULL,
	"external_key_hash" text NOT NULL,
	"external_source" text DEFAULT 'Powerschool' NOT NULL,
	"external_name" text,
	"school_id" uuid NOT NULL,
	"name" text,
	"local_course_code" text,
	"state_course_code" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "courses_external_key_hash_unique" UNIQUE("external_key_hash")
);
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sections" (
	"section_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"no_of_students" integer NOT NULL,
	"section_number" integer NOT NULL,
	"course_number" text NOT NULL,
	"grade_level" integer NOT NULL,
	"external_key" text NOT NULL,
	"external_id" text NOT NULL,
	"external_key_hash" text NOT NULL,
	"external_source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sections_external_key_hash_unique" UNIQUE("external_key_hash")
);
--> statement-breakpoint
ALTER TABLE "sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "terms" (
	"term_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"abbreviation" text NOT NULL,
	"school_id" uuid NOT NULL,
	"year_id" text NOT NULL,
	"external_id" text,
	"external_name" text,
	"external_key" text,
	"external_key_hash" text,
	"external_source" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "terms_external_key_hash_unique" UNIQUE("external_key_hash")
);
--> statement-breakpoint
ALTER TABLE "terms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Allow Reading of Courses" ON "courses" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = "courses"."school_id"
      )
    );--> statement-breakpoint
CREATE POLICY "Allow Reading of Sections" ON "sections" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = "sections"."school_id"
      )
    );--> statement-breakpoint
CREATE POLICY "Allow Reading of Terms" ON "terms" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = "terms"."school_id"
      )
    );