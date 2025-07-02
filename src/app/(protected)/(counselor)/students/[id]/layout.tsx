'use client'
import { StudentProfileHeader } from '@/components/StudentProfileHeader';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StudentInfo } from '@/types/StudentInfo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function StudentProfileLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
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

    const tabs = [
        { label: 'Profile', href: `/students/${student.studentId}` },
        { label: 'Grades', href: `/students/${student.studentId}/grades` },
        { label: 'Meeting Notes', href: `/students/${student.studentId}/meeting-notes` },
    ];

  return (
    <div className="flex flex-col w-full h-[95%] mt-12">
        <StudentProfileHeader
            firstName={student.firstName}
            lastName={student.lastName}
            fullName={student.fullName}
            gradeLevel={student.gradeLevel ?? ''}
            graduationYear={student.graduationYear ?? ''}
            studentId={student.externalId?.toString() ?? ''}
            email={student.email ?? ''}
        />

        <div className="flex justify-center mt-4 rounded-full">
          <div className="flex space-x-8 bg-white rounded-4xl shadow p-2">
            {tabs.map((tab) => (
              <Link  key={tab.label} href={tab.href}><button
                className={`px-4 py-2 font-semibold rounded-full focus:outline-none cursor-pointer ${
                  pathname === tab.href 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-200'
                }`}>
                  {tab.label}
                </button>
            </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col w-full h-[95%] mt-8">
            {children}
        </div>
    </div>
  );
}
