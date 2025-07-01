ALTER POLICY "Allow Reading of Courses" ON "courses" TO authenticated USING (
      EXISTS (
        SELECT 1
        FROM
          user_school_memberships usm
          CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
        WHERE
          usm.user_id = auth.uid() AND
          usm.school_id = "courses"."school_id" AND
          (
            app_context.current_school_id IS NULL OR
            usm.school_id = app_context.current_school_id
          )
      )
    );--> statement-breakpoint
ALTER POLICY "Allow Reading of Terms" ON "terms" TO authenticated USING (
      EXISTS (
        SELECT 1
        FROM
          user_school_memberships usm
          CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
        WHERE
          usm.user_id = auth.uid() AND
          usm.school_id = "terms"."school_id" AND
          (
            app_context.current_school_id IS NULL OR
            usm.school_id = app_context.current_school_id
          )
      )
    );