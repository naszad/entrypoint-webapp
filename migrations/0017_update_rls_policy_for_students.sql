-- Custom SQL migration file, put your code below! --

CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.current_school_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- In this migration we are updating the RLS policy for the students table.
-- The updated policy will ensure that if the `app.current_school_id` session
-- variable is set, queries will be scoped to that specific school. This is
-- crucial for the AI assistant's functionality, as it relies on this session
-- variable to correctly filter data based on the user's selected school.
-- When `app.current_school_id` is not set (e.g., for requests from the main
-- application that use `studentsService`), the policy defaults to its previous
-- behavior, ensuring that existing functionality remains unaffected.

-- First, we temporarily disable RLS on the students table to modify the policy.
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- Then, we drop the existing policy so we can recreate it with the updated logic.
-- Note: It is assumed the policy is named "Enable read access for authorized users".
-- If your policy has a different name, you may need to adjust this script.
DROP POLICY IF EXISTS "Allow Reading of Students" ON public.students;

-- Here, we create the new policy.
CREATE POLICY "Allow Reading of Students"
ON public.students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM
      user_school_memberships usm
      JOIN school_student_link ssl ON usm.school_id = ssl.school_id
      CROSS JOIN LATERAL (SELECT public.get_current_school_id() as current_school_id) as app_context
    WHERE
      usm.user_id = auth.uid() AND
      ssl.student_id = students.student_id AND
      (
        app_context.current_school_id IS NULL OR
        ssl.school_id = app_context.current_school_id
      )
  )
);

-- Finally, we re-enable RLS on the students table.
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;