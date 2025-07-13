'use client';

import { useCallback, useEffect, useState } from 'react';
import GradeLetter from '@/components/GradeLetter';
import GradeCodeSelector from '@/components/GradeCodeSelector';
import { CourseGradeInfo, CreditType, YearGradeInfo } from '@/types/YearGradeInfo';
import { useParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Hardcoded GPA calculation for now
function getGPA() {
  return 3.2;
}

const getGradeCodesStorageKey = (studentId: string) => {
  return `currentYearGradeCodes-${studentId}`;
}

const StudentGradesPage = () => {
  const params = useParams();
  const [studentTermGradeInfo, setStudentTermGradeInfo] = useState<YearGradeInfo[] | []>([]);
  const [allCreditTypes, setAllCreditTypes] = useState<CreditType[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const [currentCodes, setCurrentCodes] = useState<string[]>([]);

  const handleCurrentCodesChange = useCallback((codes: string[]) => {
    localStorage.setItem(getGradeCodesStorageKey(params.id as string), JSON.stringify(codes));
    setCurrentCodes(codes);
  }, [params.id]);

  const fetchStudentCurrentGrades = useCallback(async () => {
    try {
      const url = `/api/students/${params.id}/grades`;
      const response = await fetch(url);
      const data = await response.json();    
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch grades'
        });
        return;
      }
      
      // Get all unique credit types across all years
      const allCreditTypes: CreditType[] = [];
     
      data.forEach((year: YearGradeInfo) => {
        year.creditTypes.forEach((ctype: CreditType) => {
          if (!allCreditTypes.find(ct => ct.creditType === ctype.creditType)) {
            allCreditTypes.push(ctype);
          }
        });
      });
      
      setAllCreditTypes(allCreditTypes);
      setStudentTermGradeInfo(data);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch grades ${err instanceof Error ? err.message : ''}`
      });
    }
  }, [params]);

  useEffect(() => {
    fetchStudentCurrentGrades();
  }, [fetchStudentCurrentGrades]);

  // Load from localStorage on mount or when student data changes
  useEffect(() => {
    if (studentTermGradeInfo.length === 0) return;
    
    const saved = localStorage.getItem(getGradeCodesStorageKey(params.id as string));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCurrentCodes(parsed);
          return;
        }
      } catch {}
    }
    
    // If no saved data, initialize with current year's grade codes
    const currentYear = studentTermGradeInfo.find((year: YearGradeInfo) => year.isCurrent);
    if (currentYear && currentYear.gradeCodes.length > 0) {
      const defaultCodes = currentYear.gradeCodes.slice(0, 4); // Default to first 4 codes
      localStorage.setItem(getGradeCodesStorageKey(params.id as string), JSON.stringify(defaultCodes));
      setCurrentCodes(defaultCodes);
    }
  }, [studentTermGradeInfo, params.id]);

  // Helper to get courses for a credit type in a year
  const getCourses = (year: YearGradeInfo, creditType: string): CourseGradeInfo[] => {
    const ct = year.creditTypes.find((c) => c.creditType === creditType);
    return ct ? ct.courses : [];
  };

  // Clear alert message after 5 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Table rendering
  return (
    <div className="bg-white rounded-lg shadow-md p-8 items-center">
      {alertMessage && (
          <Alert variant={alertMessage.type}>
            <AlertDescription>{alertMessage.message}</AlertDescription>
          </Alert>
        )}
      {/* Card Title */}
      {studentTermGradeInfo.length > 0 ? (
        <>
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-xl font-semibold">{getGPA().toFixed(2)} Cumulative GPA</h2>
      </div>        
      
      <div className="overflow-x-auto flex justify-center">
        <div className="border-separate border-spacing-0 inline-block">
          {/* Header */}
          <div className="flex">
            <div className="px-4 py-2 text-xs font-bold text-gray-600 border-b text-left bg-gray-50 w-[150px]">CATEGORY</div>
            <div className="px-4 py-2 text-xs font-bold text-gray-600 border-b text-left bg-gray-50 w-[50px]">GPA</div>
            {studentTermGradeInfo.map((year) => (
              <div
                key={year.label}
                className="px-4 py-2 text-xs font-bold text-gray-600 border-b text-center bg-gray-50"
                
                style={{ minWidth: `${((year.isCurrent ? currentCodes.length + 1 : year.gradeCodes.length + 1) * 45) + 100}px` }}
              >
                <div className="flex">
                  {year.label}
                  {year.isCurrent && (
                    <GradeCodeSelector
                      allCodes={year.gradeCodes}
                      selectedCodes={currentCodes}
                      onChange={handleCurrentCodesChange}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Sub-header */}
          <div className="flex">
            <div className="px-4 py-2 text-xs font-bold text-gray-600 border-b text-left bg-gray-50 w-[150px]"></div>
            <div className="px-4 py-2 text-xs font-bold text-gray-600 border-b text-left bg-gray-50 w-[50px]"></div>
            {studentTermGradeInfo.map((year) => (
              <div key={year.label + '-subheader'} className="flex">
                <div className="px-4 py-2 text-xs font-bold text-gray-600 border-b text-left bg-gray-50 w-[150px]">Course</div>
                {(year.isCurrent ? year.gradeCodes.filter((gradeCode) => currentCodes.includes(gradeCode)) : year.gradeCodes).map((gradeCode: string) => (
                  <div key={year.label + '-' + gradeCode} className="px-4 py-2 text-xs font-bold text-gray-600 border-b text-center bg-gray-50 w-[45px]">{gradeCode}</div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Body */}
          <div>
            {allCreditTypes.map((ct) => {
              // Find the maximum number of courses for this credit type across all years
              const maxRows = Math.max(...studentTermGradeInfo.map((year) => getCourses(year, ct.creditType).length));
              
              // Get the GPA for this credit type (use the first available GPA from any year)
              const creditTypeGPA = studentTermGradeInfo
                .flatMap(year => year.creditTypes)
                .find(creditType => creditType.creditType === ct.creditType)?.gpa || 3.2;
              
              return Array.from({ length: maxRows }).map((_, rowIdx) => (
                <div key={ct.creditType + '-row-' + rowIdx} className="flex">
                  {/* CATEGORY and GPA columns - show content on first row, empty cells on subsequent rows */}
                  {rowIdx === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-700 align-top border-t border-gray-50 font-semibold bg-gray-50 w-[150px]">
                      {ct.creditType}
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-700 border-t border-gray-50 bg-gray-50 w-[150px] min-h-[40px]"></div>
                  )}
                  {rowIdx === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-700 align-top border-t border-gray-50 bg-gray-50 w-[50px]">
                      {creditTypeGPA.toFixed(2)}
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-700 border-t border-gray-50 bg-gray-50 w-[50px] min-h-[40px]"></div>
                  )}
                  {/* For each year, render the course at this rowIdx (if exists), else empty cells */}
                  {studentTermGradeInfo.map((year) => {
                    const courses = getCourses(year, ct.creditType);
                    const course = courses[rowIdx];
                    return (
                      <div key={year.label + '-year-data'} className="flex">
                        <div className="px-4 py-2 text-sm text-gray-700 border-t border-gray-50 bg-white w-[150px] min-h-[40px] flex items-center">
                          {course ? course.courseName : ''}
                        </div>
                        {year.gradeCodes.map((gradeCode: string) => (
                          (year.isCurrent ? currentCodes.includes(gradeCode) : true) && (
                            <div key={year.label + '-' + (course ? course.courseId : 'empty') + '-' + gradeCode} className="px-4 py-2 text-center border-t border-gray-50 bg-white w-[45px] min-h-[40px] flex items-center justify-center">
                              {course ? <GradeLetter grade={course.grades[gradeCode]?.gradeLetter ?? null} /> : ''}
                            </div>
                          )
                        ))}
                      </div>
                    );
                  })}
                </div>
              ));
            })}
            
            {/* GPA row at the bottom */}
            <div className="flex">
              <div className="px-4 py-2 text-xs font-bold text-gray-600 border-t bg-gray-50 w-[150px]">GPA</div>
              <div className="px-4 py-2 text-xs font-bold text-gray-600 border-t bg-gray-50 w-[50px]">{getGPA().toFixed(2)}</div>
              {studentTermGradeInfo.map((year) => (
                <div key={year.label + '-gpa-row'} className="flex">
                  <div className="px-4 py-2 text-sm font-bold text-gray-600 border-t bg-gray-50 w-[150px]"></div>
                  {year.gradeCodes.map((gradeCode: string) => (year.isCurrent ? currentCodes.includes(gradeCode) : true) && (
                    <div key={year.label + '-gpa-' + gradeCode} className="px-4 py-2 text-xs text-center font-bold text-gray-600 border-t bg-gray-50 w-[45px]">{getGPA().toFixed(2)}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No grades available for this student.
        </div>
      )}
    </div>
  );
};

export default StudentGradesPage; 