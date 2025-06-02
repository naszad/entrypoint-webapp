'use client';
import { columns, defaultVisibility as initialVisibility } from "@/components/StudentColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { ActionItem } from "@/components/DataTable/DataTableToolbar";
import { useState, useEffect } from "react";
import { StudentInfo } from "@/types/StudentInfo";
import { SaveViewDialog } from "@/components/SaveViewDialog";
import { useAuth } from '@/context/AuthContext'
import { saveReport } from '@/libs/reportsService';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useSearchParams } from 'next/navigation';

const StudentsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchStudents = async (filters: FilterValue[], sortField: string, sortDirection: 'asc' | 'desc') => {
    try {
      setIsLoading(true);
      const filtersParam = filters.length > 0 ? filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',') : '';
      const url = `/api/students?filters=${encodeURIComponent(filtersParam)}&sortField=${encodeURIComponent(sortField)}&sortDirection=${encodeURIComponent(sortDirection)}&pageNumber=1&pageSize=10`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        setAlertMessage({ 
          type: 'destructive', 
          message: errorData.error || 'Failed to fetch students'
        });
      }
      const result = await response.json();
      setStudents(result);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch students ${err instanceof Error ? err.message : ''}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = async (params: { filters: FilterValue[], sorting: { id: string; desc: boolean }[] }) => {
    const filters = params.filters || [];
    const sortId = params.sorting?.[0]?.id || '';
    const sortDirection = params.sorting?.[0]?.desc ? 'desc' : 'asc';
    await fetchStudents(filters, sortId, sortDirection);
  }

  // Parse URL parameters and fetch initial data
  useEffect(() => {
    const parseUrlParams = () => {
      const filters: FilterValue[] = [];
      const sorting: { id: string; desc: boolean }[] = [];

      // Parse filters from URL
      const filtersParam = searchParams.get('filters');
      if (filtersParam) {
        try {
          const filterStrings = filtersParam.split(',');
          filterStrings.forEach(filterString => {
            const parts = filterString.split(':');
            if (parts.length === 3) {
              const [key, condition, value] = parts;
              filters.push({ key, condition, value });
            }
          });
        } catch (error) {
          console.error('Error parsing filters from URL:', error);
        }
      }

      // Parse sorting from URL
      const sortParam = searchParams.get('sort');
      if (sortParam) {
        const [id, direction] = sortParam.split(':');
        if (id) {
          sorting.push({ id, desc: direction === 'desc' });
        }
      }

      return { filters, sorting };
    };

    const { filters, sorting } = parseUrlParams();
    const sortId = sorting[0]?.id || '';
    const sortDirection = sorting[0]?.desc ? 'desc' : 'asc';
    
    // Fetch data with parsed parameters
    fetchStudents(filters, sortId, sortDirection);
  }, [searchParams]); // Re-run when URL search parameters change

  const action: ActionItem[] = [];

  const handleSaveView = async (viewData: {
    name: string;
    description: string;
    params: string;
  }) => {
    try {
      if (!user?.userId) {
        throw new Error('User ID is required');
      }

      const result = await saveReport({
        ...viewData,
        pageName: 'students',
        userId: user.userId
      });

      setAlertMessage({ type: 'success', message: result.message });
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: err instanceof Error ? err.message : 'Failed to save view'
      });
    }
  };

  const handleRowClick = (student: StudentInfo) => {
    router.push(`/students/${student.studentId}`);
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

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-700">Students</h3>
      </div>
      <div className="flex gap-2 mb-4 justify-end">
        <SaveViewDialog onSave={handleSaveView} />
      </div>
      {alertMessage && (
        <Alert variant={alertMessage.type} className="mb-4">
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex-1 w-full h-50">
        <DataTable 
          columns={columns} 
          data={students} 
          className="w-full"
          actions={action}
          defaultVisibility={initialVisibility}
          onParamsChange={handleFilterApply}
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}

export default StudentsPage