'use client'
import { StudentProfileHeader } from '@/components/StudentProfileHeader';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StudentInfo } from '@/types/StudentInfo';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StudentProfileLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      const fetchStudent = async () => {
        try {
          const { id } = params
          const response = await fetch(`/api/students/${id}`);
          if (!response.ok) {
            setError('An error occurred while fetching the student, please try again later');
          }
          const studentData = await response.json();
          setStudent(studentData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred while fetching the student');
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchStudent();
    }, [params]);

    if (isLoading) {
        return (<div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>);
        }
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!student) {
    return <div>Student not found</div>;
    }

  return (
    <div className="flex flex-col w-full h-[95%] mt-12">
        <StudentProfileHeader
            firstName={student.firstName}
            lastName={student.lastName}
            fullName={student.fullName}
            gradeLevel={student.gradeLevel ?? ''}
            graduationYear={student.graduationYear ?? ''}
            studentId={student.externalId?.toString() ?? ''}
            email={student.email}
        />
      {children}
    </div>
  );
}
