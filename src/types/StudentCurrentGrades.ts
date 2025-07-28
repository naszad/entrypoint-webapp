export type StudentCurrentCourseGrade = {
  courseId: string;
  courseName: string;
  courseNumber: string;
  gradeLetter: string | null;
  gradePercentage: number | null;
  updatedAt: string | null; // ISO string
};

export type StudentCurrentGrades = {
  currentTerm: string | null; // e.g. "Q3"
  courses: StudentCurrentCourseGrade[];
}; 