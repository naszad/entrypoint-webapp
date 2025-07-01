-- Custom SQL migration file, put your code below! --

CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.current_school_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql VOLATILE;


ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;