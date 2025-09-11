import { StudentInfo } from "./StudentInfo";
import { Course, StudentGrade } from "@/types/Models";

export interface StudentGradeInfo extends StudentGrade {
  student: StudentInfo;
  course: Course;
}