--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "course_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER POLICY "Allow Reading of Sections" ON "sections" TO authenticated USING (
      EXISTS (
        SELECT 1
        FROM courses c
        JOIN user_school_memberships usm ON usm.school_id = c.school_id
        WHERE c.course_id = "sections"."course_id"
          AND usm.user_id = auth.uid()
      )
    );

ALTER TABLE "sections" DROP CONSTRAINT "sections_school_id_schools_school_id_fk";
ALTER TABLE "sections" DROP COLUMN "school_id";--> statement-breakpoint
