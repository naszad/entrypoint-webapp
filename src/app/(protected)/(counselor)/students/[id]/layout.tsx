'use client'
import { StudentProfileHeader } from '@/components/StudentProfileHeader';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StudentInfo } from '@/types/StudentInfo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchStudentById } from '@/libs/studentsService';

export default function StudentProfileLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      const fetchStudent = async () => {
        try {
          const data = await fetchStudentById(params.id as string);
          setStudent(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchStudent();
    }, [params.id]);

    if (isLoading) {
        return <div>Loading...</div>;
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
