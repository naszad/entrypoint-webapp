ALTER TABLE "student_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tag_canonical_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tag_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Allow Reading of Student Tags" ON "student_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN school_student_link ssl ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
          AND ssl.student_id = "student_tags"."student_id"
        )
      );--> statement-breakpoint
CREATE POLICY "Allow Inserting Student Tags" ON "student_tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
         EXISTS (
           SELECT 1
           FROM user_school_memberships usm
           JOIN school_student_link ssl ON usm.school_id = ssl.school_id
           WHERE usm.user_id = auth.uid()
           AND ssl.student_id = "student_tags"."student_id"
         )
       );--> statement-breakpoint
CREATE POLICY "Allow Updating Student Tags" ON "student_tags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN school_student_link ssl ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
          AND ssl.student_id = "student_tags"."student_id"
        )
      );--> statement-breakpoint
CREATE POLICY "Allow Deleting Student Tags" ON "student_tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN school_student_link ssl ON usm.school_id = ssl.school_id
          WHERE usm.user_id = auth.uid()
          AND ssl.student_id = "student_tags"."student_id"
        )
      );--> statement-breakpoint
CREATE POLICY "Allow Reading of Tag Canonical Values" ON "tag_canonical_values" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM tags t
          JOIN user_school_memberships usm ON EXISTS (
            SELECT 1 FROM schools s 
            WHERE s.customer_id = t.customer_id 
            AND s.school_id = usm.school_id
          )
          WHERE t.tag_id = "tag_canonical_values"."tag_id"
          AND usm.user_id = auth.uid()
        )
      );--> statement-breakpoint
CREATE POLICY "Allow Reading of Tag Categories" ON "tag_categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() IS NOT NULL);--> statement-breakpoint
CREATE POLICY "Allow Reading of Tags" ON "tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM user_school_memberships usm
          JOIN schools s ON usm.school_id = s.school_id
          WHERE usm.user_id = auth.uid()
          AND s.customer_id = "tags"."customer_id"
        )
      );--> statement-breakpoint
CREATE POLICY "Allow Inserting Tags" ON "tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (
         EXISTS (
           SELECT 1
           FROM user_school_memberships usm
           JOIN schools s ON usm.school_id = s.school_id
           WHERE usm.user_id = auth.uid()
           AND s.customer_id = customer_id
         )
       );