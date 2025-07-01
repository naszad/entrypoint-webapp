ALTER TABLE "student_grades" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Allow Reading of Student Grades" ON "student_grades" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
      EXISTS (
        SELECT 1
        FROM sections s
        JOIN courses c ON s.course_id = c.course_id
        JOIN user_school_memberships usm ON usm.school_id = c.school_id
        CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
        WHERE s.section_id = "student_grades"."section_id"
          AND usm.user_id = auth.uid()
          AND (
            app_context.current_school_id IS NULL OR
            c.school_id = app_context.current_school_id
          )
      )
    );--> statement-breakpoint
ALTER POLICY "Allow Reading of Sections" ON "sections" TO authenticated USING (
      EXISTS (
        SELECT 1
        FROM courses c
        JOIN user_school_memberships usm ON usm.school_id = c.school_id
        CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
        WHERE c.course_id = "sections"."course_id"
          AND usm.user_id = auth.uid()
          AND (
            app_context.current_school_id IS NULL OR
            c.school_id = app_context.current_school_id
          )
      )
    );