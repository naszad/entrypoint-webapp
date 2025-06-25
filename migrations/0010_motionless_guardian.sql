ALTER TABLE "sections" ALTER COLUMN "grade_level" SET DATA TYPE text;--> statement-breakpoint
ALTER POLICY "Allow Reading of Sections" ON "sections" TO authenticated USING (
      EXISTS (
        SELECT 1
        FROM courses c
        JOIN user_school_memberships usm ON usm.school_id = c.school_id
        WHERE c.course_id = "sections"."course_id"
          AND usm.user_id = auth.uid()
      )
    );