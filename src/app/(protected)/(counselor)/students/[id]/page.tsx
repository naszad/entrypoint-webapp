'use client';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { StudentTermGradeInfo } from "@/types/StudentTermGradeInfo";
import { useParams } from "next/navigation";
import { gradeColors } from "../../../../../utils/gradeColors";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";


const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const StudentProfilePage = () => {

  const params = useParams();

  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const [studentTermGradeInfo, setStudentTermGradeInfo] = useState<StudentTermGradeInfo | null>(null);
  const [gpaInfo, setGpaInfo] = useState<{ value: number; method: string; } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentCurrentGrades = useCallback(async ( studentId: string ) => {
    try {
      const url = `/api/students/grades?studentId=${studentId}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch students'
        });
        return;
      }

      setStudentTermGradeInfo(data.studentTermGradeInfo);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch students ${err instanceof Error ? err.message : ''}`
      });
    }
  }, []);

  const fetchGpa = useCallback(async (studentId: string) => {
    try {
      const url = `/api/students/${studentId}/gpa`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch GPA'
        });
        return;
      }

      setGpaInfo({ value: data.gpa, method: data.method });
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch GPA ${err instanceof Error ? err.message : ''}`
      });
    }
  }, []);

  useEffect(() => {
    const studentId = params.id as string;
    if (studentId) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([
          fetchStudentCurrentGrades(studentId),
          fetchGpa(studentId)
        ]);
        setIsLoading(false);
      };
      loadData();
    }
  }, [params, fetchGpa, fetchStudentCurrentGrades]);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {alertMessage && (
          <Alert variant={alertMessage.type}>
            <AlertDescription>{alertMessage.message}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Grades</h3>
          {isLoading ? (
            <div className="text-right">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-8 w-16" />
            </div>
          ) : gpaInfo && gpaInfo.value !== null ? (
            <div className="text-right">
              <p className="text-sm text-gray-500 capitalize">
                {gpaInfo.method.replace(/_/g, ' ')} GPA
              </p>
              <p className="text-2xl font-bold text-gray-900">{gpaInfo.value.toFixed(2)}</p>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <div className="flex flex-row">
              <div className="border-r w-2/5">
                <div className="px-4 py-2">
                  <Skeleton className="h-4 w-1/4" />
                </div>
                {[...Array(5)].map((_, index) => (
                  <div key={index} className={`px-4 py-2 h-10 ${index % 2 === 1 ? 'bg-white' : 'bg-gray-100'}`}>
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
              {[...Array(2)].map((_, termIndex) => (
                <div key={termIndex} className="border-r flex-1">
                  <div className="px-4 py-2 text-center">
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                  {[...Array(5)].map((_, courseIndex) => (
                    <div key={courseIndex} className={`px-4 py-2 text-center h-10 ${courseIndex % 2 === 1 ? 'bg-white' : 'bg-gray-100'}`}>
                      <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : studentTermGradeInfo && studentTermGradeInfo.courses.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex flex-row">
              {/* Course names column */}
                <div className="border-r w-2/5">
                  <div className="px-4 py-2 text-xs font-bold text-gray-600">
                    COURSE
                  </div>
                  {studentTermGradeInfo.courses.map((course, index) => (
                    <div key={course.courseId} className={`px-4 py-2 text-sm text-gray-700 h-10 ${index % 2 === 1 ? 'bg-white' : 'bg-gray-100'}`}>
                      {course.courseName} ({course.courseNumber})
                    </div>
                  ))}
                </div>

                {/* Term columns */}
                {studentTermGradeInfo.terms.map((term) => (
                  <div key={term.termId} className="border-r flex-1">
                    <div className="px-4 py-2 text-xs font-bold text-gray-600 text-center">
                      {term.abbreviation}
                    </div>
                    {studentTermGradeInfo.courses.map((course, index) => {
                      const grade = course.grades[term.termId];
                      return (
                        <div key={course.courseId} className={`px-4 py-2 text-center h-10 ${index % 2 === 1 ? 'bg-white' : 'bg-gray-100'}`}>
                          {grade ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={`px-3 py-1 rounded-full font-semibold text-sm cursor-pointer ${gradeColors[grade.gradeLetter]}`}
                                >
                                  {grade.gradeLetter}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="flex flex-col items-center">
                                  <span>{grade.gradePercentage}%</span>
                                  <span className="text-xs text-gray-400">Updated: {formatDate(grade.updatedAt)}</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No current grades available for this student.
            </div>
          )}
      </div>
    </div>
  );
};

export default StudentProfilePage; 