export interface StudentAbsenceInfo {
  studentDailyAbsenceId: string;
  studentId: string;
  absenceDate: string;
  yearId: string;
  yearName: string;
  sisCode?: string;
  normalizedAbsenceCode?: string;
  externalSource: string;
  externalName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAbsencesResponse {
  absences: StudentAbsenceInfo[];
  count?: number;
}
