'use client';

import { useCallback, useEffect, useState } from 'react';
import GradeLetter from '@/components/GradeLetter';
import GradeCodeSelector from '@/components/GradeCodeSelector';
import { CourseGradeInfo, CreditType, YearGradeInfo } from '@/types/YearGradeInfo';
import { useParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ALL_GRADE_CODES, FINALIZED_GRADE_CODES } from '@/utils/gradeCodes';
import React from 'react';

// Types for the new bulk GPA API response
interface BulkGpaResponse {
  cumulative: { gpa: number; method: string };
  currentYear: { gpa: number; method: string };
  byYearAndQuarter: Record<string, Record<string, number>>;
  byCreditType: Record<string, number>;
}



const getGradeCodesStorageKey = (studentId: string) => {
  return `currentYearGradeCodes-${studentId}`;
}

const StudentGradesPage = () => {
  const params = useParams();
  const [studentTermGradeInfo, setStudentTermGradeInfo] = useState<YearGradeInfo[]>([]);
  const [allCreditTypes, setAllCreditTypes] = useState<CreditType[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const [currentCodes, setCurrentCodes] = useState<string[]>([]);
  const [gpaData, setGpaData] = useState<BulkGpaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCurrentCodesChange = useCallback((codes: string[]) => {
    localStorage.setItem(getGradeCodesStorageKey(params.id as string), JSON.stringify(codes));
    setCurrentCodes(codes);
  }, [params.id]);

  const fetchStudentCurrentGrades = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchBulkGpaData = useCallback(async () => {
    if (!params.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/students/${params.id}/gpa?bulk=true`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to fetch GPA data:', data.error);
        return;
      }
      
      setGpaData(data);
    } catch (err) {
      console.error('Failed to fetch GPA data:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Load student grades and GPA data on mount
  useEffect(() => {
    fetchStudentCurrentGrades();
  }, [fetchStudentCurrentGrades]);

  // Load saved selections from localStorage once data is loaded
  useEffect(() => {
    if (studentTermGradeInfo.length === 0) return;
    
    // Load saved grade codes
    const savedCodes = localStorage.getItem(getGradeCodesStorageKey(params.id as string));
    if (savedCodes && currentCodes.length === 0) {
      try {
        const parsed = JSON.parse(savedCodes);
        if (Array.isArray(parsed)) {
          setCurrentCodes(parsed);
        }
      } catch {}
    } else if (currentCodes.length === 0) {
      // Default to Q1-Q4 for current year
      const defaultCodes = ['Q1', 'Q2', 'Q3', 'Q4'];
      localStorage.setItem(getGradeCodesStorageKey(params.id as string), JSON.stringify(defaultCodes));
      setCurrentCodes(defaultCodes);
    }
  }, [studentTermGradeInfo, currentCodes.length, params.id]);

  // Fetch GPA data when data is loaded
  useEffect(() => {
    if (studentTermGradeInfo.length > 0 && allCreditTypes.length > 0) {
      fetchBulkGpaData();
    }
  }, [fetchBulkGpaData, studentTermGradeInfo.length, allCreditTypes.length]);

  // Helper to get courses for a credit type in a year
  const getCourses = (year: YearGradeInfo, creditType: string): CourseGradeInfo[] => {
    const ct = year.creditTypes.find((c) => c.creditType === creditType);
    return ct ? ct.courses : [];
  };

  // Get GPA for a specific quarter in a specific year
  const getQuarterGpa = (yearLabel: string, quarter: string): string => {
    if (!gpaData?.byYearAndQuarter || !gpaData.byYearAndQuarter[yearLabel] || gpaData.byYearAndQuarter[yearLabel][quarter] === undefined) return '-';
    return gpaData.byYearAndQuarter[yearLabel][quarter].toFixed(2);
  };

  // Get GPA for a specific credit type (from bulk data)
  const getCreditTypeGpa = (creditType: string): string => {
    if (!gpaData?.byCreditType || gpaData.byCreditType[creditType] === undefined) return '-';
    return gpaData.byCreditType[creditType].toFixed(2);
  };

  // Get current year cumulative GPA (from bulk API response)
  const getCurrentYearGpa = (): string => {
    if (!gpaData?.currentYear || gpaData.currentYear.gpa === null || gpaData.currentYear.gpa === undefined) return '-';
    return gpaData.currentYear.gpa.toFixed(2);
  };

  // Clear alert message after 3 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 overflow-x-auto flex flex-col items-center">
        {/* Loading skeleton for header */}
        <div className="mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        
        {/* Loading skeleton for table */}
        <table className="table-auto border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-3 py-2 w-32">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="text-center px-3 py-2 w-14">
                <Skeleton className="h-4 w-8" />
              </th>
              {[...Array(3)].map((_, yearIndex) => (
                <React.Fragment key={yearIndex}>
                  <th className="text-left px-3 py-2 border-l border-gray-200">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  {[...Array(4)].map((_, termIndex) => (
                    <th key={termIndex} className="text-center px-3 py-2 w-14">
                      <Skeleton className="h-4 w-6" />
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(4)].map((_, creditTypeIndex) => (
              <React.Fragment key={creditTypeIndex}>
                {[...Array(3)].map((_, courseIndex) => (
                  <tr key={courseIndex} className={courseIndex === 2 ? 'border-b-2 border-gray-200' : ''}>
                    {courseIndex === 0 && (
                      <>
                        <td className="px-3 py-2 font-medium bg-gray-50 align-top" rowSpan={3}>
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-3 py-2 text-center bg-gray-50 w-14 align-top" rowSpan={3}>
                          <Skeleton className="h-4 w-8" />
                        </td>
                      </>
                    )}
                    {[...Array(3)].map((_, yearIndex) => (
                      <React.Fragment key={yearIndex}>
                        <td className="px-3 py-2 text-left align-top border-l border-gray-200">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        {[...Array(4)].map((_, termIndex) => (
                          <td key={termIndex} className="px-3 py-2 text-center align-top w-14">
                            <Skeleton className="h-6 w-6 rounded-full" />
                          </td>
                        ))}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-100">
              <td className="px-3 py-2">
                <Skeleton className="h-4 w-8" />
              </td>
              <td className="px-3 py-2 w-14">
                <Skeleton className="h-4 w-8" />
              </td>
              {[...Array(3)].map((_, yearIndex) => (
                <React.Fragment key={yearIndex}>
                  <td className="px-3 py-2 border-l border-gray-200"></td>
                  {[...Array(4)].map((_, termIndex) => (
                    <td key={termIndex} className="px-3 py-2 text-center w-14">
                      <Skeleton className="h-4 w-8" />
                    </td>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto flex flex-col items-center">
      {alertMessage && (
        <Alert variant={alertMessage.type}>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
      
      {studentTermGradeInfo.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold mb-4">
            {gpaData?.cumulative && gpaData.cumulative.gpa !== null 
              ? `${gpaData.cumulative.gpa.toFixed(2)} Cumulative GPA`
              : '— Cumulative GPA'
            }
          </h2>
          
          <table className="table-auto border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Category</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600 uppercase w-14 min-w-[3.5rem] max-w-[3.5rem]">GPA</th>
                {studentTermGradeInfo.filter(year => !year.isCurrent).map(year => (
                  <React.Fragment key={year.label}>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-l border-gray-200">{year.label}</th>
                    {FINALIZED_GRADE_CODES.map(code => (
                      <th key={code} className="text-center px-3 py-2 text-xs font-semibold text-gray-600 uppercase w-14 min-w-[3.5rem] max-w-[3.5rem]">{code}</th>
                    ))}
                  </React.Fragment>
                ))}
                {(() => {
                  const currentYear = studentTermGradeInfo.find(year => year.isCurrent);
                  return currentYear ? (
                    <React.Fragment key={currentYear.label}>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap border-l border-gray-200">
                        <div className="flex items-center gap-2">
                          <span>{currentYear.label}</span>
                          <GradeCodeSelector
                            allCodes={[...ALL_GRADE_CODES]}
                            selectedCodes={currentCodes}
                            onChange={handleCurrentCodesChange}
                          />
                        </div>
                      </th>
                      {currentCodes.map(code => (
                        <th key={code} className="text-center px-3 py-2 text-xs font-semibold text-gray-600 uppercase w-14 min-w-[3.5rem] max-w-[3.5rem]">{code}</th>
                      ))}
                    </React.Fragment>
                  ) : null;
                })()}
              </tr>
            </thead>
            <tbody>
              {allCreditTypes.map((ct) => {
                const maxRows = Math.max(...studentTermGradeInfo.map((year) => getCourses(year, ct.creditType).length));
                const rows = Array.from({ length: Math.max(1, maxRows) });

                if (maxRows === 0) {
                  return (
                    <tr key={ct.creditType}>
                      <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap bg-gray-50">
                        {ct.creditType}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600 bg-gray-50 w-14 min-w-[3.5rem] max-w-[3.5rem]">
                        {getCreditTypeGpa(ct.creditType)}
                      </td>
                      {studentTermGradeInfo.filter(year => !year.isCurrent).map(year => (
                        <React.Fragment key={year.label}>
                          <td className="border-l border-gray-200"></td>
                          {FINALIZED_GRADE_CODES.map(code => (
                            <td key={code} className=""></td>
                          ))}
                        </React.Fragment>
                      ))}
                      {(() => {
                        const currentYear = studentTermGradeInfo.find(year => year.isCurrent);
                        return currentYear ? (
                          <React.Fragment>
                            <td className="border-l border-gray-200"></td>
                            {currentCodes.map(code => (
                              <td key={code}></td>
                            ))}
                          </React.Fragment>
                        ) : null;
                      })()}
                    </tr>
                  );
                }

                return rows.map((_, rowIndex) => (
                  <tr
                    key={`${ct.creditType}-${rowIndex}`}
                    className={rowIndex === rows.length - 1 ? 'border-b-2 border-gray-200' : ''}
                  >
                    {rowIndex === 0 && (
                      <>
                        <td
                          className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap bg-gray-50 align-top"
                          rowSpan={rows.length}
                        >
                          {ct.creditType}
                        </td>
                        <td
                          className="px-3 py-2 text-center text-xs text-gray-600 bg-gray-50 w-14 min-w-[3.5rem] max-w-[3.5rem] align-top"
                          rowSpan={rows.length}
                        >
                          {getCreditTypeGpa(ct.creditType)}
                        </td>
                      </>
                    )}

                    {studentTermGradeInfo.filter(year => !year.isCurrent).map(year => {
                      const courses = getCourses(year, ct.creditType);
                      const course = courses[rowIndex];
                      return (
                        <React.Fragment key={year.label}>
                          <td className="px-3 py-2 text-left align-top font-medium text-gray-800 whitespace-nowrap border-l border-gray-200">
                            {course ? course.courseName : <span className="text-gray-300">—</span>}
                          </td>
                          {FINALIZED_GRADE_CODES.map(code => (
                            <td
                              key={code}
                              className="px-3 py-2 text-center align-top w-14 min-w-[3.5rem] max-w-[3.5rem]"
                            >
                              {course ? (
                                <GradeLetter grade={course.grades[code]?.gradeLetter ?? null} />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {(() => {
                      const currentYear = studentTermGradeInfo.find(year => year.isCurrent);
                      if (!currentYear) return null;
                      
                      const courses = getCourses(currentYear, ct.creditType);
                      const course = courses[rowIndex];
                      return (
                        <React.Fragment key={currentYear.label}>
                          <td className="px-3 py-2 text-left align-top font-medium text-gray-800 whitespace-nowrap border-l border-gray-200">
                            {course ? course.courseName : <span className="text-gray-300">—</span>}
                          </td>
                          {currentCodes.map(code => (
                            <td
                              key={code}
                              className="px-3 py-2 text-center align-top w-14 min-w-[3.5rem] max-w-[3.5rem]"
                            >
                              {course ? (
                                <GradeLetter grade={course.grades[code]?.gradeLetter ?? null} />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          ))}
                        </React.Fragment>
                      );
                    })()}
                  </tr>
                ));
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-100 font-semibold">
                <td className="px-3 py-2 text-left text-gray-700 whitespace-nowrap">GPA</td>
                <td className="px-3 py-2 text-center text-gray-700 w-14 min-w-[3.5rem] max-w-[3.5rem]">
                  {getCurrentYearGpa()}
                </td>
                {studentTermGradeInfo.filter(year => !year.isCurrent).map(year => (
                  <React.Fragment key={`${year.label}-gpa`}>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap border-l border-gray-200"></td>
                    {FINALIZED_GRADE_CODES.map(code => (
                      <td
                        key={`${year.label}-${code}-gpa`}
                        className="px-3 py-2 text-center text-gray-700 w-14 min-w-[3.5rem] max-w-[3.5rem]"
                      >
                        {getQuarterGpa(year.label, code)}
                      </td>
                    ))}
                  </React.Fragment>
                ))}
                {(() => {
                  const currentYear = studentTermGradeInfo.find(year => year.isCurrent);
                  return currentYear ? (
                    <React.Fragment>
                      <td className="px-3 py-2 border-l border-gray-200"></td>
                      {currentCodes.map(code => (
                        <td
                          key={`${currentYear.label}-${code}-gpa`}
                          className="px-3 py-2 text-center text-gray-700 w-14 min-w-[3.5rem] max-w-[3.5rem]"
                        >
                          {getQuarterGpa(currentYear.label, code)}
                        </td>
                      ))}
                    </React.Fragment>
                  ) : null;
                })()}
              </tr>
            </tfoot>
          </table>
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