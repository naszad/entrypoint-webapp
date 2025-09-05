CREATE TABLE "student_daily_absences" (
	"student_daily_absence_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"year_id" uuid NOT NULL,
	"absence_date" date NOT NULL,
	"external_source" text DEFAULT 'Powerschool' NOT NULL,
	"external_name" text,
	"external_id" text NOT NULL,
	"external_key" text NOT NULL,
	"external_key_hash" text NOT NULL,
	"sis_code" text,
	"normalized_absence_code" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "student_daily_absences_external_key_unique" UNIQUE("external_key"),
	CONSTRAINT "student_daily_absences_external_key_hash_unique" UNIQUE("external_key_hash"),
	CONSTRAINT "student_daily_absences_customer_id_student_id_absence_date_unique" UNIQUE("customer_id","student_id","absence_date")
);
--> statement-breakpoint
ALTER TABLE "student_daily_absences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "student_daily_absences" ADD CONSTRAINT "student_daily_absences_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_daily_absences" ADD CONSTRAINT "student_daily_absences_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_daily_absences" ADD CONSTRAINT "student_daily_absences_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_daily_absences" ADD CONSTRAINT "student_daily_absences_year_id_years_year_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."years"("year_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Allow Reading of Student Daily Absences" ON "student_daily_absences" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = "student_daily_absences"."school_id"
      )
    );