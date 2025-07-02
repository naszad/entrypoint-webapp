type GradeInfo = {
    gradeLetter: string;
    gradePercentage: number;
    gradePoints: number;
    updatedAt: string;
}

type TermInfo = {
    termId: string;
    abbreviation: string;
  };
  
  type CourseGradeByTerm = {
    [termId: string]: GradeInfo; 
  };
  
  type CourseGradeInfo = {
    courseId: string;
    courseName: string;
    courseNumber: string,
    grades: CourseGradeByTerm;
  };
  
  export type StudentTermGradeInfo = {
    terms: TermInfo[];
    courses: CourseGradeInfo[];
  };

