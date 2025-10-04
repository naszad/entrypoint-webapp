export interface StudentTardyInfo {
  sectionEnrollmentId: string;
  studentId: string;
  sectionId: string;
  termId: string;
  tardies: number;
  yearId: string;
  yearName: string;
  courseName: string;
  courseNumber: string;
  termName: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentTardiesResponse {
  tardies: StudentTardyInfo[];
  count?: number;
}
