'use client';
import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { columns, defaultVisibility as initialVisibility } from "@/components/GradeColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SaveViewDialog } from "@/components/SaveViewDialog";
import { saveReport } from '@/libs/reportsService';
import { StudentGradeInfo } from "@/types/StudentGradeInfo";
import { useAuth } from '@/context/AuthContext'


const GradesPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [studentGrades, setStudentGrades] = useState<StudentGradeInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [gradeCodes, setGradeCodes] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialPageSize = (() => {
    const sizeParam = searchParams.get('pageSize');
    const parsed = sizeParam ? parseInt(sizeParam, 10) : undefined;
    if (parsed && !isNaN(parsed) && parsed > 0) return parsed;
    if (typeof window !== 'undefined') {
      const savedPageSize = localStorage.getItem('pagination-pageSize');
      if (savedPageSize) {
        const parsedLocal = parseInt(savedPageSize, 10);
        if (!isNaN(parsedLocal) && parsedLocal > 0) return parsedLocal;
      }
    }
    return 50;
  })();

  // Store current filters and sorting for pagination changes
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);

  const fetchStudentGrades = async (
    filters: FilterValue[], 
    sortField: string, 
    sortDirection: 'asc' | 'desc',
    pageNumber: number = 1,
    pageSize: number = 50
  ) => {
    try {      
      setIsLoading(true);
      const filtersParam = filters.length > 0 ? filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',') : '';
      let queryParams = `?filters=${encodeURIComponent(filtersParam)}`;
      if (sortField) {
        queryParams += `&sort=${encodeURIComponent(sortField)}:${encodeURIComponent(sortDirection)}`;
      }
      const url = `/api/grades${queryParams}&pageNumber=${pageNumber}&pageSize=${pageSize}&fetchWithCount=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch student grades'
        });
        return;
      }

      setStudentGrades(data.data);
      setTotalCount(data.count);
      setGradeCodes(data.gradeCodes);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch student grades ${err instanceof Error ? err.message : ''}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Unified handler for DataTable param changes
  const handleParamsChange = async (params: { filters: FilterValue[], sorting: { id: string; desc: boolean }[], pageNumber: number, pageSize: number }) => {
    const filters = params.filters || [];
    const sorting = params.sorting || [];
    const sortId = sorting[0]?.id || '';
    const sortDirection = sorting[0]?.desc ? 'desc' : 'asc';
    setCurrentPageSize(params.pageSize);
    await fetchStudentGrades(filters, sortId, sortDirection, params.pageNumber, params.pageSize);
  };

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
        pageName: 'grades',
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

  const multiSelectRemoteSource = async (columnId: string) => {
    if (columnId === 'gradeCode') return gradeCodes.map(code => ({ value: code, label: code }));
    return [];
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
        <h3 className="text-2xl font-bold text-gray-700">Grades</h3>
        <div className="flex gap-2 justify-end">
          <SaveViewDialog onSave={handleSaveView} />
        </div>
      </div>
      
      {alertMessage && (
        <Alert variant={alertMessage.type} className="mb-4">
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex-1 w-full h-50">
        <DataTable 
          enablePagination={true}
          total={totalCount}
          columns={columns} 
          data={studentGrades} 
          className="w-full"
          defaultVisibility={initialVisibility}
          onParamsChange={handleParamsChange}
          multiSelectRemoteSource={multiSelectRemoteSource}
          isLoading={isLoading}
          pageSize={currentPageSize}
        />
      </div>
    </div>
  );
}

export default GradesPage