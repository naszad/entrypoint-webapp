ALTER TABLE "meeting_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Allow Access to Own Notes" ON "meeting_notes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        "meeting_notes"."user_id" = auth.uid()
      );--> statement-breakpoint
CREATE POLICY "Allow Access to Non-Private Notes for Students in User Schools" ON "meeting_notes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        "meeting_notes"."private" = false
        AND EXISTS (
          SELECT 1
          FROM user_school_memberships AS usm
          JOIN school_student_link     AS ssl
            ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
            AND ssl.student_id = "meeting_notes"."student_id"
        )
      );