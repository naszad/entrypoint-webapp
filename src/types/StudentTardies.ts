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
  teacherName?: string;
  termName: string;
  externalSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentTardiesResponse {
  tardies: StudentTardyInfo[];
  count?: number;
}
