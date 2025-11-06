'use client'
import { StudentProfileHeader } from '@/components/StudentProfileHeader';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StudentInfo } from '@/types/StudentInfo';
import { StudentTagInfo } from '@/types/StudentTagInfo';
import { Alert } from '@/components/ui/alert';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { StudentContext } from '@/context/StudentContext';

export default function StudentProfileLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [studentTags, setStudentTags] = useState<StudentTagInfo | null>(null);
    const [allCategories, setAllCategories] = useState<{ tagCategoryId: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<{ tagId: string; name: string; categoryId: string; categoryName: string; values: string[]; isMultiValue: boolean }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();
    const studentId = params.id as string;
    useEffect(() => {
      const fetchData = async () => {
        try {
          
          // Fetch student data
          const studentResponse = await fetch(`/api/students/${studentId}`);
          if (!studentResponse.ok) {
            setError('An error occurred while fetching the student, please try again later');
            return;
          }
          const studentData = await studentResponse.json();
          setStudent(studentData);
          
          // Fetch student tags
          const tagsResponse = await fetch(`/api/students/${studentId}/tags`);
          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            setStudentTags(tagsData);
          }
          
          // Fetch all categories
          const categoriesResponse = await fetch('/api/tags?type=categories');
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setAllCategories(categoriesData);
          }
          
          // Fetch all tags
          const allTagsResponse = await fetch('/api/tags');
          if (allTagsResponse.ok) {
            const allTagsData = await allTagsResponse.json();
            setAllTags(allTagsData);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchData();
    }, [studentId]);
    
    // Listen for immediate tag refresh requests from child pages (e.g., meeting notes page)
    useEffect(() => {
      const handleTagsRefresh = async () => {
        try {
          // Refresh student tags
          const tagsResponse = await fetch(`/api/students/${studentId}/tags`);
          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            setStudentTags(tagsData);
            // Trigger a subtle animation on the header tag area
            // Mark new tags in local state to animate them on first render
            // We do this by creating temporary ids that SortableCategory/Tag recognize
            setStudentTags(prev => {
              if (!prev) return tagsData;
              const existingIds = new Set(prev.categories.flatMap(c => c.tags.map(t => t.studentTagId)));
              const updated = { ...tagsData };
              updated.categories = updated.categories.map((cat: { categoryId: string; categoryName: string; tags: Array<{ studentTagId: string; tagId: string; tagName: string; tagValue: string }> }) => ({
                ...cat,
                tags: cat.tags.map((t: { studentTagId: string; tagId: string; tagName: string; tagValue: string }) => ({
                  ...t,
                  studentTagId: existingIds.has(t.studentTagId) ? t.studentTagId : `temp:${t.studentTagId}`
                }))
              }));
              // After a short delay, drop the temp markers by reloading again silently
              setTimeout(async () => {
                try {
                  const resp = await fetch(`/api/students/${studentId}/tags`);
                  if (resp.ok) {
                    const fresh = await resp.json();
                    setStudentTags(fresh);
                  }
                } catch {}
              }, 400);
              return updated;
            });
          }
          
          // Also refresh all tags to get any new canonical values
          const allTagsResponse = await fetch('/api/tags');
          if (allTagsResponse.ok) {
            const allTagsData = await allTagsResponse.json();
            setAllTags(allTagsData);
          }
        } catch (err) {
          console.warn('Tag refresh failed', err);
        }
      };

      const directAddHandler = async () => {
        await handleTagsRefresh();
      };

      window.addEventListener('student-tags:refresh', directAddHandler);
      window.addEventListener('student-tags:added', directAddHandler);
      return () => {
        window.removeEventListener('student-tags:refresh', directAddHandler);
        window.removeEventListener('student-tags:added', directAddHandler);
      };
    }, [studentId]);
    
    const handleTagAdd = async (tag: { tagId?: string; tagName: string; tagCategoryId: string; value: string }) => {
      try {
        const response = await fetch(`/api/students/${studentId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tag),
        });
        
        if (response.ok) {
          // Refresh tags
          const tagsResponse = await fetch(`/api/students/${studentId}/tags`);
          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            setStudentTags(tagsData);
          }
          
          // Refresh all tags to get any new canonical values
          // This includes both new tag creation AND new canonical values for existing tags
          const allTagsResponse = await fetch('/api/tags');
          if (allTagsResponse.ok) {
            const allTagsData = await allTagsResponse.json();
            setAllTags(allTagsData);
          }
        }
      } catch (err) {
        console.error('Failed to add tag:', err);
      }
    };
    
    const handleTagEdit = async (studentTagId: string, value: string) => {
      try {
        const response = await fetch(`/api/students/${studentId}/tags`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentTagId, value }),
        });
        
        if (response.ok) {
          // Refresh tags
          const tagsResponse = await fetch(`/api/students/${studentId}/tags`);
          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            setStudentTags(tagsData);
          }
          
          // Refresh all tags to get any new canonical values
          const allTagsResponse = await fetch('/api/tags');
          if (allTagsResponse.ok) {
            const allTagsData = await allTagsResponse.json();
            setAllTags(allTagsData);
          }
        }
      } catch (err) {
        console.error('Failed to edit tag:', err);
      }
    };
    
    const handleTagDelete = async (studentTagId: string) => {
      try {
        const response = await fetch(`/api/students/${studentId}/tags`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentTagId }),
        });
        
        if (response.ok) {
          // Refresh tags
          const tagsResponse = await fetch(`/api/students/${studentId}/tags`);
          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            setStudentTags(tagsData);
          }
        }
      } catch (err) {
        console.error('Failed to delete tag:', err);
      }
    };

    if (isLoading) {
        return (<div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>);
        }
    
    if (error) {
        return (
            <Alert  className="mb-4"
              autoClose={true}
              variant="destructive"
              message={error}
              onClose={() => {}}
          />
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
            studentId={student.studentNumber?.toString() ?? ''}
            enrollmentStatus={student.enrollmentStatus ?? ''}
            email={student.email ?? ''}
            tags={studentTags?.categories}
            allTagCategories={allCategories}
            allTags={allTags}
            onTagAdd={handleTagAdd}
            onTagEdit={handleTagEdit}
            onTagDelete={handleTagDelete}
            onTagsReorder={(reorderedTags) => {
              // Update local state with reordered tags
              if (studentTags) {
                setStudentTags({
                  ...studentTags,
                  categories: reorderedTags
                });
              }
              // You can also persist the order to the backend here if needed
              console.log('Tags reordered:', reorderedTags);
            }}
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
            <StudentContext.Provider value={{ student, isLoading }}>
              {children}
            </StudentContext.Provider>
        </div>
    </div>
  );
}
