ALTER TABLE "school_student_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Allow Reading of Student School Links" ON "school_student_link" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
          EXISTS (
            SELECT 1
            FROM
              user_school_memberships usm
              CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
            WHERE
              usm.user_id = auth.uid() AND
              usm.school_id = "school_student_link"."school_id" AND
              (
                app_context.current_school_id IS NULL OR
                usm.school_id = app_context.current_school_id
              )
          )
        );