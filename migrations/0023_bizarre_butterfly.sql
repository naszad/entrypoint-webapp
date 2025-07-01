ALTER TABLE "section_enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Allow Reading of Section Enrollments" ON "section_enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
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