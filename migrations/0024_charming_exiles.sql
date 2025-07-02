ALTER TABLE "courses" DROP CONSTRAINT "courses_school_id_schools_school_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_customer_id_customers_customer_id_fk";
--> statement-breakpoint
ALTER TABLE "schools" DROP CONSTRAINT "schools_customer_id_customers_customer_id_fk";
--> statement-breakpoint
ALTER TABLE "section_enrollments" DROP CONSTRAINT "section_enrollments_student_id_students_student_id_fk";
--> statement-breakpoint
ALTER TABLE "section_enrollments" DROP CONSTRAINT "section_enrollments_section_id_sections_section_id_fk";
--> statement-breakpoint
ALTER TABLE "section_enrollments" DROP CONSTRAINT "section_enrollments_term_id_terms_term_id_fk";
--> statement-breakpoint
ALTER TABLE "sections" DROP CONSTRAINT "sections_course_id_courses_course_id_fk";
--> statement-breakpoint
ALTER TABLE "school_student_link" DROP CONSTRAINT "school_student_link_student_id_students_student_id_fk";
--> statement-breakpoint
ALTER TABLE "school_student_link" DROP CONSTRAINT "school_student_link_school_id_schools_school_id_fk";
--> statement-breakpoint
ALTER TABLE "terms" DROP CONSTRAINT "terms_school_id_schools_school_id_fk";
--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "external_source" SET DEFAULT 'Powerschool';--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "external_source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "external_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "external_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "external_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "student_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "section_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "term_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "absences" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "absences" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "tardies" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "tardies" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "section_enrollments" ALTER COLUMN "external_source" SET DEFAULT 'Powerschool';--> statement-breakpoint
ALTER TABLE "sections" ALTER COLUMN "external_source" SET DEFAULT 'Powerschool';--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "external_source" SET DEFAULT 'Powerschool';--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "external_source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "external_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "external_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "external_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terms" ALTER COLUMN "external_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terms" ALTER COLUMN "external_key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terms" ALTER COLUMN "external_key_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "terms" ALTER COLUMN "external_source" SET DEFAULT 'Powerschool';--> statement-breakpoint
ALTER TABLE "terms" ALTER COLUMN "external_source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD COLUMN "transaction_date" date;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD COLUMN "external_name" text;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "external_name" text;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "terms" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_section_id_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("section_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_term_id_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("term_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school_student_link" ADD CONSTRAINT "school_student_link_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "school_student_link" ADD CONSTRAINT "school_student_link_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_external_key_unique" UNIQUE("external_key");--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_external_key_unique" UNIQUE("external_key");--> statement-breakpoint
ALTER TABLE "section_enrollments" ADD CONSTRAINT "section_enrollments_external_key_unique" UNIQUE("external_key");--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_external_key_unique" UNIQUE("external_key");--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_external_key_unique" UNIQUE("external_key");--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_external_key_unique" UNIQUE("external_key");--> statement-breakpoint
ALTER POLICY "Allow Reading of Section Enrollments" ON "section_enrollments" TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM sections s
            JOIN courses c ON s.course_id = c.course_id
            JOIN user_school_memberships usm ON usm.school_id = c.school_id
            CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
            WHERE s.section_id = "section_enrollments"."section_id"
            AND usm.user_id = auth.uid()
            AND (
                app_context.current_school_id IS NULL OR
                c.school_id = app_context.current_school_id
            )
        )
        );