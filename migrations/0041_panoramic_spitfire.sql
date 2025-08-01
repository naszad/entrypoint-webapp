CREATE TYPE "public"."source" AS ENUM('manual', 'ai', 'import');--> statement-breakpoint
CREATE TABLE "student_tags" (
	"student_tag_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid,
	"tag_id" uuid,
	"value" text NOT NULL,
	"canonical_value_id" uuid,
	"source" "source" NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "student_tags_student_id_tag_id_value_unique" UNIQUE("student_id","tag_id","value")
);
--> statement-breakpoint
CREATE TABLE "tag_canonical_values" (
	"tag_canonical_value_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid,
	"value" text NOT NULL,
	"search_key_words" text,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tag_canonical_values_tag_id_value_unique" UNIQUE("tag_id","value")
);
--> statement-breakpoint
CREATE TABLE "tag_categories" (
	"tag_category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tag_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"tag_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_category_id" uuid,
	"customer_id" uuid,
	"name" text NOT NULL,
	"is_multi_value" boolean DEFAULT false NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tags_tag_category_id_customer_id_name_unique" UNIQUE("tag_category_id","customer_id","name")
);
--> statement-breakpoint
ALTER TABLE "years" RENAME COLUMN "year_start" TO "start_year";--> statement-breakpoint
ALTER TABLE "years" RENAME COLUMN "year_end" TO "end_year";--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "schools" ADD COLUMN "gpa_config" jsonb;--> statement-breakpoint -- This was getting added when it shouldn't have been, it's already in 0026_add_gpa_config_to_schools
ALTER TABLE "years" ADD COLUMN "nominal_start_date" date;--> statement-breakpoint
ALTER TABLE "years" ADD COLUMN "nominal_end_date" date;--> statement-breakpoint
ALTER TABLE "years" ADD COLUMN "is_current" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_student_id_students_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_canonical_value_id_tag_canonical_values_tag_canonical_value_id_fk" FOREIGN KEY ("canonical_value_id") REFERENCES "public"."tag_canonical_values"("tag_canonical_value_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_updated_by_user_id_users_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_canonical_values" ADD CONSTRAINT "tag_canonical_values_tag_id_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("tag_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_canonical_values" ADD CONSTRAINT "tag_canonical_values_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag_canonical_values" ADD CONSTRAINT "tag_canonical_values_updated_by_user_id_users_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_tag_category_id_tag_categories_tag_category_id_fk" FOREIGN KEY ("tag_category_id") REFERENCES "public"."tag_categories"("tag_category_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_updated_by_user_id_users_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "years" DROP COLUMN "year_external_id";--> statement-breakpoint
ALTER TABLE "years" ADD CONSTRAINT "years_name_unique" UNIQUE("name");