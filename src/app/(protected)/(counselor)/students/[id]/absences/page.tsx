'use client';
import { useState } from "react";
import { useParams, useSearchParams } from 'next/navigation';
import { columns, defaultVisibility as initialVisibility } from "@/components/AbsenceColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { Alert } from "@/components/ui/alert";
import { StudentAbsenceInfo } from "@/types/StudentAbsences";


const AbsencesPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [studentAbsences, setStudentAbsences] = useState<StudentAbsenceInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const searchParams = useSearchParams();
  const params = useParams();
  
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

  const fetchStudentAbsences = async (
    filters: FilterValue[], 
    sortField: string, 
    sortDirection: 'asc' | 'desc',
    pageNumber: number = 1,
    pageSize: number = 50,
  ) => {
    try {      
      setIsLoading(true);
      
      // Build query parameters more carefully
      const queryParams = new URLSearchParams();
      
      // Only add filters if there are any
      if (filters.length > 0) {
        const filtersParam = filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',');
        queryParams.set('filters', filtersParam);
      }
      
      // Add sort if provided
      if (sortField) {
        queryParams.set('sort', `${sortField}:${sortDirection}`);
      }
      
      // Add pagination and count parameters
      queryParams.set('pageNumber', pageNumber.toString());
      queryParams.set('pageSize', pageSize.toString());
      queryParams.set('fetchWithCount', 'true');
      
      const url = `/api/students/${params.id}/absences-details?${queryParams.toString()}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch student absences'
        });
        return;
      }

      setStudentAbsences(data.absences);
      setTotalCount(data.count);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch student absences ${err instanceof Error ? err.message : ''}`
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
    await fetchStudentAbsences(filters, sortId, sortDirection, params.pageNumber, params.pageSize);
  };

  return (
    
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-700">Absences</h3>
      </div>
      
      {alertMessage && (
        <Alert  className="mb-4"
          autoClose={true}
          variant={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}
      <div className="flex-1 w-full h-50">
        <DataTable 
          enablePagination={true}
          total={totalCount}
          columns={columns} 
          data={studentAbsences} 
          className="w-full"
          defaultVisibility={initialVisibility}
          onParamsChange={handleParamsChange}
          isLoading={isLoading}
          pageSize={currentPageSize}
        />
      </div>
    </div>
  );
}

export default AbsencesPage