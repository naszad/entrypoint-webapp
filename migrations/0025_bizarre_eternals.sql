CREATE TABLE "years" (
	"year_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year_start" integer NOT NULL,
	"year_end" integer NOT NULL,
	"year_external_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_grades" ALTER COLUMN "external_source" SET DEFAULT 'Powerschool';--> statement-breakpoint
ALTER TABLE "terms" ALTER COLUMN "year_id" SET DATA TYPE uuid USING "year_id"::uuid;--> statement-breakpoint
ALTER TABLE "student_grades" ADD COLUMN "external_name" text;--> statement-breakpoint
ALTER TABLE "student_grades" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_year_id_years_year_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."years"("year_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_external_key_unique" UNIQUE("external_key");