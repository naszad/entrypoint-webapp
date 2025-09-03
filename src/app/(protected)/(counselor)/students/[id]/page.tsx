'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentCurrentGrades } from "@/types/StudentCurrentGrades";
import { StudentFinalTermGpa } from "@/types/StudentFinalTermGpa"; 
import { gradeColors } from "@/utils/gradeColors";
import { useAuth } from "@/context/AuthContext";
import { useConfig } from "@/hooks/useConfig";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const StudentProfilePage = () => {

  const params = useParams();
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const [currentGrades, setCurrentGrades] = useState<StudentCurrentGrades | null>(null);
  const [gpaInfo, setGpaInfo] = useState<{ value: number; method: string; } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [finalTermsGpas, setFinalTermsGpas] = useState<StudentFinalTermGpa[]>([]);

  const { user } = useAuth();
  const configKeys = useMemo(() => ['final_grade_codes'], []);
  const { loading: loadingConfig, finalGradeCodes } = useConfig(configKeys);

  const fetchStudentCurrentGrades = useCallback(async ( studentId: string ) => {
    try {
      const url = `/api/students/${studentId}/grades?current=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch students'
        });
        return;
      }

      setCurrentGrades(data.currentGrades);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch students ${err instanceof Error ? err.message : ''}`
      });
    }
  }, []);

  const fetchGpa = useCallback(async (studentId: string) => {
    if (loadingConfig) {
      return;
    }
    try {

      const url = `/api/students/${studentId}/gpa?gradeCodes=${finalGradeCodes.join(',')}`;
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
  }, [finalGradeCodes, loadingConfig]);

  const fetchFinalTermsGpas = useCallback(async (studentId: string) => {
    try {
      const url = `/api/students/${studentId}/gpa?finalOnly=true&userId=${user?.userId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch GPA History'
        });
        return;
      }

      setFinalTermsGpas(data.finalTermsGpas);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch GPA History ${err instanceof Error ? err.message : ''}`
      });
    }
  }, [user?.userId]);

  useEffect(() => {
    const studentId = params.id as string;
    if (studentId) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchStudentCurrentGrades(studentId), fetchGpa(studentId), fetchFinalTermsGpas(studentId)]);
        setIsLoading(false);
      };
      loadData();
    }
  }, [params, fetchGpa, fetchStudentCurrentGrades, fetchFinalTermsGpas]);

  return (
    <>
      {alertMessage && (
        <Alert variant={alertMessage.type}>
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-row gap-6">
         {/* Current grades panel */}
        <div className="w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
          
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {`Current Grades${currentGrades && currentGrades.currentTerm ? ` (${currentGrades.currentTerm})` : ''}`}
              </h3>
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
            ) : currentGrades && currentGrades.courses.length > 0 ? (
              <div className="divide-y rounded-md border">
                {currentGrades.courses.map((course, index) => (
                  <div
                    key={course.courseId}
                    className={`grid grid-cols-2 items-center px-4 py-2 text-sm ${index % 2 === 1 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <div>{`${course.courseName} (${course.courseNumber})`}</div>
                    <div className="text-right">
                      {course.gradeLetter ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`px-3 py-1 rounded-full font-semibold text-sm cursor-pointer ${gradeColors[course.gradeLetter]}`}
                            >
                              {course.gradeLetter}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col items-center">
                              {course.gradePercentage !== null && (
                                <span>{course.gradePercentage}%</span>
                              )}
                              {course.updatedAt && (
                                <span className="text-xs text-gray-400">Updated: {formatDate(course.updatedAt)}</span>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center text-gray-500 py-8">
                  No current grades available for this student.
                </div>
              )}
          </div>
        </div>
        {/* GPA History panel */}
        <div className="w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                GPA Trend
              </h3>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {/* Chart skeleton */}
                <div className="relative">
                  <Skeleton className="h-52 w-full rounded-md" />
                  {/* X-axis skeleton */}
                  <div className="flex justify-between mt-2">
                    {[...Array(5)].map((_, index) => (
                      <Skeleton key={index} className="h-3 w-8" />
                    ))}
                  </div>
                  {/* Y-axis skeleton */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-3 w-8" />
                    ))}
                  </div>
                </div>
                {/* Legend skeleton */}
                <div className="flex justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
                         ) : finalTermsGpas && finalTermsGpas.length > 0 ? (
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart
                     data={finalTermsGpas}
                     margin={{
                       top: 5,
                       right: 30,
                       left: 20,
                       bottom: 25,
                     }}
                   >
                     <XAxis 
                       dataKey="term" 
                       angle={-45}
                       textAnchor="end"
                       height={60}
                     />
                                           <YAxis 
                        domain={[1, Math.max(4, ...finalTermsGpas.map(item => item.gpa))]}
                        ticks={Array.from({ length: Math.max(4, ...finalTermsGpas.map(item => item.gpa)) }, (_, i) => i + 1)}
                      />
                     <RechartsTooltip />
                     <Line
                       type="monotone"
                       dataKey="gpa"
                       stroke="#3b82f6"
                       strokeWidth={2}
                       dot={{ fill: '#3b82f6' }}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No GPA history available for this student.
              </div>
            )}
          </div>
        </div>
      </div>
     

      
    </>
  );
};

export default StudentProfilePage; 