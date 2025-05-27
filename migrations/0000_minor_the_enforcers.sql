CREATE TABLE "schools" (
	"school_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"school_number" integer,
	"city" text,
	"state" text,
	"country" text,
	"address" text,
	"phone" text,
	"principal_name" text,
	"principal_email" text,
	"assistant_principal_name" text,
	"assistant_principal_email" text,
	"external_source" text,
	"external_key" text,
	"external_id" integer,
	"external_key_hash" text NOT NULL,
	"external_name" text
);
--> statement-breakpoint
ALTER TABLE "schools" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "students" (
	"student_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(256),
	"grade_level" integer NOT NULL,
	"gender" varchar(256),
	"date_of_birth" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"external_source" text,
	"external_key" text,
	"external_id" integer,
	"external_key_hash" text NOT NULL,
	"external_name" text,
	"graduation_year" integer,
	"enrollment_status" text NOT NULL,
	"homeroom_name" text,
	"full_name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "school_student_link" (
	"student_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" date,
	"updated_at" date
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"email" varchar(256) NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "user_school_memberships" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" date,
	"updated_at" date
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("school_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Allow Reading of Schools" ON "schools" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
      EXISTS (
        SELECT 1 FROM user_school_memberships usm
        WHERE usm.user_id = auth.uid()
        AND usm.school_id = "schools"."school_id"
      )
    );--> statement-breakpoint
CREATE POLICY "Allow Reading of Students" ON "students" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM user_school_memberships AS usm
          JOIN school_student_link       AS ssl
            ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
            AND ssl.student_id = "students"."student_id"
        )
      );