export type StudentCurrentCourseGrade = {
  courseId: string;
  courseName: string;
  courseNumber: string;
  gradeLetter: string | null;
  gradePercentage: number | null;
  updatedAt: string | null; // ISO string
};

export type StudentCurrentGrades = {
  termAbbreviations: string[]; // e.g. ["Q3", "Q4"]
  courses: StudentCurrentCourseGrade[];
}; 