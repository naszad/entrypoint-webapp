'use client';
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { columns, defaultVisibility as initialVisibility } from "@/components/GradeColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SaveViewDialog } from "@/components/SaveViewDialog";
import { saveReport } from '@/libs/reportsService';
import { StudentGradeInfo } from "@/types/StudentGradeInfo";
import { useChatAssistantOpen } from "@/context/ChatAssistantOpenContext";
import { useAuth } from '@/context/AuthContext'
import { cn } from "@/utils/utils"
import { Switch } from "@/components/ui/switch";


const GradesPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [studentGrades, setStudentGrades] = useState<StudentGradeInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [gradeCodes, setGradeCodes] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isChatAssistantOpen } = useChatAssistantOpen();
  const { user } = useAuth();
  const [mostRecentOnly, setMostRecentOnly] = useState<boolean>(() => {
    // Check URL parameter first
    const urlParam = searchParams.get('mostRecentOnly');
    if (urlParam === 'true') {
      return true;
    }
    
    // Fall back to localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('grades-mostRecentOnly');
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          return false;
        }
      }
    }
    return false;
  });

  // Ensure the setting is persisted and URL is updated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('grades-mostRecentOnly', JSON.stringify(mostRecentOnly));
    
    // Update URL to reflect mostRecentOnly state
    const newSearchParams = new URLSearchParams();
    
    // Copy all existing params
    searchParams.forEach((value, key) => {
      if (key !== 'mostRecentOnly') {
        newSearchParams.set(key, value);
      }
    });
    
    // Add mostRecentOnly if true
    if (mostRecentOnly) {
      newSearchParams.set('mostRecentOnly', 'true');
    }
    
    const newQuery = newSearchParams.toString();
    const currentQuery = searchParams.toString();
    
    // Only update URL if it's actually different
    if (currentQuery !== newQuery) {
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(newUrl);
    }
  }, [mostRecentOnly, searchParams, pathname, router]);

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
    pageSize: number = 50,
    recentOnlyOverride?: boolean
  ) => {
    try {      
      setIsLoading(true);
      const filtersParam = filters.length > 0 ? filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',') : '';
      let queryParams = `?filters=${encodeURIComponent(filtersParam)}`;
      if (sortField) {
        queryParams += `&sort=${encodeURIComponent(sortField)}:${encodeURIComponent(sortDirection)}`;
      }
      const mostRecent = typeof recentOnlyOverride === 'boolean' ? recentOnlyOverride : mostRecentOnly;
      const url = `/api/grades${queryParams}&pageNumber=${pageNumber}&pageSize=${pageSize}&fetchWithCount=true&mostRecentOnly=${mostRecent}`;
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
    setLastQuery({ filters, sortField: sortId, sortDirection, pageNumber: params.pageNumber, pageSize: params.pageSize });
    await fetchStudentGrades(filters, sortId, sortDirection, params.pageNumber, params.pageSize);
  };

  // Track last query so toggle can refetch
  const [lastQuery, setLastQuery] = useState<{ filters: FilterValue[]; sortField: string; sortDirection: 'asc' | 'desc'; pageNumber: number; pageSize: number } | null>(null);

  const handleToggleMostRecent = async (checked: boolean) => {
    setMostRecentOnly(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('grades-mostRecentOnly', JSON.stringify(checked));
    }
    const q = lastQuery;
    if (q) {
      await fetchStudentGrades(q.filters, q.sortField, q.sortDirection, q.pageNumber, q.pageSize, checked);
    }
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
        <div className={cn("flex gap-4 items-center justify-end", isChatAssistantOpen ? "" : "mr-35")}>          
          <SaveViewDialog onSave={handleSaveView} />
        </div>
      </div>
      <div className="flex mb-4 gap-2 justify-end">
        <Switch
          className="cursor-pointer"
          checked={mostRecentOnly}
          onCheckedChange={handleToggleMostRecent}
        />
        <span className="text-base font-medium text-gray-700">Only most recent</span>
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
          mostRecentOnly={mostRecentOnly}
        />
      </div>
    </div>
  );
}

export default GradesPage