CREATE POLICY "Allow Insert Own Notes" ON "meeting_notes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
      "meeting_notes"."user_id" = auth.uid()
    );--> statement-breakpoint
CREATE POLICY "Allow Update Own Notes" ON "meeting_notes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
      "meeting_notes"."user_id" = auth.uid()
    ) WITH CHECK (
      "meeting_notes"."user_id" = auth.uid()
    );--> statement-breakpoint
CREATE POLICY "Allow Delete Own Notes" ON "meeting_notes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
      "meeting_notes"."user_id" = auth.uid()
    );--> statement-breakpoint
ALTER POLICY "Allow Access to Own Notes" ON "meeting_notes" TO authenticated USING (
      "meeting_notes"."user_id" = auth.uid()
    );--> statement-breakpoint
ALTER POLICY "Allow Access to Non-Private Notes for Students in User Schools" ON "meeting_notes" TO authenticated USING (
      "meeting_notes"."private" = false
      AND EXISTS (
        SELECT 1
        FROM user_school_memberships AS usm
        JOIN school_student_link AS ssl
          ON usm.school_id = ssl.school_id
        WHERE usm.user_id = auth.uid()
          AND ssl.student_id = "meeting_notes"."student_id"
      )
    );