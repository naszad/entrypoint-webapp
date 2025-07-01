CREATE TABLE "section_enrollments" (
	"section_enrollment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"start_date" date,
	"end_date" date,
	"absences" integer,
	"tardies" integer,
	"external_key" text NOT NULL,
	"external_id" text NOT NULL,
	"external_key_hash" text NOT NULL,
	"external_source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "section_enrollments_external_key_hash_unique" UNIQUE("external_key_hash"),
	CONSTRAINT "section_enrollments_student_id_section_id_unique" UNIQUE("student_id","section_id")
);
--> statement-breakpoint
CREATE TABLE "student_grades" (
	"grade_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"grade_letter" text,
	"grade_code" text NOT NULL,
	"grade_percent" numeric,
	"grade_points" numeric,
	"credit_hours_earned" numeric,
	"credit_type" text,
	"grade_status" text NOT NULL,
	"comment" text,
	"grade_level" text,
	"source_api" text NOT NULL,
	"source_updated_date" timestamp NOT NULL,
	"data_source_system" text DEFAULT 'PowerSchool' NOT NULL,
	"external_grade_id" text,
	"last_syncronized_at" timestamp DEFAULT now(),
	"external_key" text NOT NULL,
	"external_id" text NOT NULL,
	"external_key_hash" text NOT NULL,
	"external_source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "student_grades_external_key_hash_unique" UNIQUE("external_key_hash")
);
--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_section_id_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_term_id_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("term_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_section_id_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_term_id_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("term_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE no action ON UPDATE no action;