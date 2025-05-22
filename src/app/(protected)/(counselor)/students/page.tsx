'use client';
import { columns, defaultVisibility as initialVisibility } from "@/components/StudentColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { ActionItem } from "@/components/DataTable/DataTableToolbar";
import { useState, useEffect } from "react";
import { StudentInfo } from "@/types/StudentInfo";
import { SaveViewDialog } from "@/components/SaveViewDialog";
import { useAuth } from '@/context/AuthContext'
import { fetchStudentsByFilterCriter } from '@/libs/studentsService';
import { saveReport } from '@/libs/reportsService';
import { Alert, AlertDescription } from "@/components/ui/alert";

const StudentsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const { user } = useAuth();

  const fetchStudents = async (filters: FilterValue[], sortField: string, sortDirection: 'asc' | 'desc') => {
    try {
      setIsLoading(true);
      const result = await fetchStudentsByFilterCriter({
        filters,
        sortInfo: { sortField, sortDirection },
        pagingInfo: { pageNumber: 1, pageSize: 10 }
      });
      setStudents(result);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setAlertMessage({ 
        type: 'destructive', 
        message: 'Failed to fetch students'
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
        />
      </div>
    </div>
  );
}

export default StudentsPage