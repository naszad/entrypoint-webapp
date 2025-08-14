create or replace view latest_student_grades as
select distinct on (student_id, course_id) *
from student_grades
order by student_id, course_id, updated_at desc;