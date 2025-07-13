type GradeInfo = {
    gradeLetter: string;
    gradePercentage: number;
    gradePoints: number;
    updatedAt: string;
}

type CourseGradeByGradeCode = {
    [gradeCode: string]: GradeInfo; 
};

export type CourseGradeInfo = {
    courseId: string;
    courseName: string;
    courseNumber: string,
    grades: CourseGradeByGradeCode;
};

export type CreditType = {
    creditType: string;
    gpa: number;
    courses: CourseGradeInfo[];
}

export type YearGradeInfo = {
    yearId: string;
    label: string;
    isCurrent: boolean;
    gradeCodes: string[];
    creditTypes: CreditType[];
}