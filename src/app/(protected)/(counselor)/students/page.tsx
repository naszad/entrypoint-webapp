'use client';
import { columns, defaultVisibility as initialVisibility } from "@/components/StudentColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { ActionItem } from "@/components/DataTable/DataTableToolbar";
import { useState, useRef } from "react";
import { StudentInfo } from "@/types/StudentInfo";
import { SaveViewDialog } from "@/components/SaveViewDialog";
import { useAuth } from '@/context/AuthContext'
import { saveReport } from '@/libs/reportsService';
import { Alert } from "@/components/ui/alert";
import { useRouter, useSearchParams } from 'next/navigation';
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatAssistantOpen } from "@/context/ChatAssistantOpenContext";
import { cn } from "@/utils/utils"
import { useStudentsAnalytics } from '@/hooks/useStudentsAnalytics';
import { trackEvent } from '@/libs/mixpanelClient';

const StudentsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isChatAssistantOpen } = useChatAssistantOpen();
  const { trackExport, trackFiltersChanged } = useStudentsAnalytics();
  const lastFilterKeysRef = useRef<string>('');

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

  const fetchStudents = async (
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
      const url = `/api/students${queryParams}&pageNumber=${pageNumber}&pageSize=${pageSize}&fetchWithCount=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch students'
        });
        return;
      }

      setStudents(data.data);
      setTotalCount(data.count);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch students ${err instanceof Error ? err.message : ''}`
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
    await fetchStudents(filters, sortId, sortDirection, params.pageNumber, params.pageSize);

    // Track filter applications (avoid duplicate firing if unchanged)
    const keySignature = Array.from(new Set(filters.map(f => f.key))).sort().join('|');
    if (keySignature !== lastFilterKeysRef.current) {
      trackFiltersChanged({ filterValues: filters });
      lastFilterKeysRef.current = keySignature;
    }
  };

  const action: ActionItem[] = [];

  const handleSaveView = async (viewData: {
    name: string;
    description: string;
    params: string;
  }) => {
    try {
      if (!user?.user_id) {
        throw new Error('User ID is required');
      }

      const result = await saveReport({
        ...viewData,
        pageName: 'students',
        userId: user.user_id
      });

      setAlertMessage({ type: 'success', message: result.message });
      // Track report saved (we do not include the name to reduce PII / cardinality)
      trackEvent('Students Report Saved', {
        page: '/students',
        has_description: !!viewData.description,
        param_length: viewData.params?.length || 0,
      });
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

  const handleDownloadClick = async () => {
    const filters = searchParams.get('filters');
    const sort = searchParams.get('sort');
    const columns = searchParams.get('columns') || Object.keys(initialVisibility).filter(key => initialVisibility[key as keyof typeof initialVisibility] === true).join(',');
    let url = `/api/students/download?columns=${columns}`;
    if (filters) {
      url += `&filters=${filters}`;
    }
    if (sort) {
      url += `&sort=${sort}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      setAlertMessage({ 
        type: 'destructive', 
        message: errorData.error || 'Failed to download students'
      });
    } else {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      // Track export after successful generation
      const activeFilters: FilterValue[] = [];
      const filtersParam = searchParams.get('filters');
      if (filtersParam) {
        try {
          filtersParam.split(',').forEach(f => {
            const parts = f.split(':');
            if (parts.length === 3) {
              const [key, condition, value] = parts;
              activeFilters.push({ key, condition, value });
            }
          });
        } catch {}
      }
      trackExport({ filterValues: activeFilters, columnCount: columns.split(',').length });
    }
  };

  return (

    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-700">Students</h3>
        <div className={cn("flex gap-2 justify-end", isChatAssistantOpen ? "" : "mr-35")}>
          <Button id="download-button" variant="action" onClick={handleDownloadClick}>
            <DownloadIcon className="w-4 h-4" />
            Download
          </Button>
          <SaveViewDialog onSave={handleSaveView} />
        </div>
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
          data={students} 
          className="w-full"
          actions={action}
          defaultVisibility={initialVisibility}
          onParamsChange={handleParamsChange}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          pageSize={currentPageSize}
        />
      </div>
    </div>
  );
}

export default StudentsPage