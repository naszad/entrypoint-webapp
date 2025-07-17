import { StudentGrade } from "@/models/StudentGrades";
import { StudentInfo } from "./StudentInfo";
import { Course } from "@/models/Courses";

export interface StudentGradeInfo extends StudentGrade {
  student: StudentInfo;
  course: Course;
}