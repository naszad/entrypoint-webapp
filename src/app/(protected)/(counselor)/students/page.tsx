'use client';
import { columns, defaultVisibility as initialVisibility } from "@/components/StudentColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { ActionItem } from "@/components/DataTable/DataTableToolbar";
import { useState, useRef, useEffect, useCallback } from "react";
import { StudentInfo } from "@/types/StudentInfo";
import { SaveViewDialog } from "@/components/SaveViewDialog";
import { useAuth } from '@/context/AuthContext'
import { saveReport } from '@/libs/reportsService';
import { Alert } from "@/components/ui/alert";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatAssistantOpen } from "@/context/ChatAssistantOpenContext";
import { cn } from "@/utils/utils"
import { useStudentsAnalytics } from '@/hooks/useStudentsAnalytics';
import { trackEvent } from '@/libs/mixpanelClient';
import { Switch } from "@/components/ui/switch";

const StudentsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isChatAssistantOpen } = useChatAssistantOpen();
  const { trackExport, trackFiltersChanged } = useStudentsAnalytics();
  const lastFilterKeysRef = useRef<string>('');
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const [activeOnly, setActiveOnly] = useState<boolean>(() => {
    const urlParam = searchParams.get('activeOnly');
    if (urlParam === 'false') {
      return false;
    }
    if (urlParam === 'true') {
      return true;
    }
    
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('students-activeOnly');
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          return true;
        }
      }
    }
    return true;
  });

  useEffect(() => {
    const urlParam = searchParams.get('activeOnly');
    const newActiveOnlyValue = urlParam === 'false' ? false : urlParam === 'true' ? true : null;
    
    if (newActiveOnlyValue !== null && newActiveOnlyValue !== activeOnly) {
      setActiveOnly(newActiveOnlyValue);
      
      const filtersParam = searchParams.get('filters');
      const filters: FilterValue[] = filtersParam
        ? filtersParam.split(',').map(filter => {
            const [key, condition, value] = filter.split(':');
            return { key, condition, value };
          })
        : [];
      
      const sortParam = searchParams.get('sort');
      const [sortField, sortDirection] = sortParam ? sortParam.split(':') : ['', 'asc'];
      
      const pageNumber = parseInt(searchParams.get('pageNumber') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || String(currentPageSize), 10);
      
      fetchStudents(filters, sortField, sortDirection as 'asc' | 'desc', pageNumber, pageSize, newActiveOnlyValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('students-activeOnly', JSON.stringify(activeOnly));
    
    const currentActiveOnlyParam = searchParams.get('activeOnly');
    
    const expectedParamValue = activeOnly ? 'true' : 'false';
    
    if (currentActiveOnlyParam !== null && currentActiveOnlyParam !== expectedParamValue) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('activeOnly', expectedParamValue);
      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      router.replace(newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly, pathname]);

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
  const previousPageNumberRef = useRef<number>(1);
  const previousPageSizeRef = useRef<number>(initialPageSize);
  const shouldScrollToTopRef = useRef(false);

  const scrollTableToTop = useCallback(() => {
    const scrollContainer = tableScrollRef.current;
    if (!scrollContainer) {
      return;
    }

    const resetScroll = (element: HTMLElement) => {
      element.scrollTop = 0;
      if (typeof element.scrollTo === 'function') {
        element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    };

    resetScroll(scrollContainer);

    const innerScrollable = scrollContainer.querySelector<HTMLElement>('[data-slot="table-container"]');
    if (innerScrollable) {
      resetScroll(innerScrollable);
    }
  }, []);

  const scheduleScrollToTopIfNeeded = useCallback(() => {
    if (!shouldScrollToTopRef.current) {
      return;
    }

    const performScroll = () => {
      scrollTableToTop();
      shouldScrollToTopRef.current = false;
    };

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(performScroll);
      });
    } else {
      performScroll();
    }
  }, [scrollTableToTop]);

  const fetchStudents = async (
    filters: FilterValue[], 
    sortField: string, 
    sortDirection: 'asc' | 'desc',
    pageNumber: number = 1,
    pageSize: number = 50,
    activeOnlyOverride?: boolean
  ) => {
    try {      
      setIsLoading(true);
      const filtersParam = filters.length > 0 ? filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',') : '';
      let queryParams = `?filters=${encodeURIComponent(filtersParam)}`;
      if (sortField) {
        queryParams += `&sort=${encodeURIComponent(sortField)}:${encodeURIComponent(sortDirection)}`;
      }
      const activeOnlyValue = typeof activeOnlyOverride === 'boolean' ? activeOnlyOverride : activeOnly;
      const url = `/api/students${queryParams}&pageNumber=${pageNumber}&pageSize=${pageSize}&fetchWithCount=true&activeOnly=${activeOnlyValue}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        shouldScrollToTopRef.current = false;
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch students'
        });
        return;
      }

      setStudents(data.data);
      setTotalCount(data.count);
    } catch (err) {
      shouldScrollToTopRef.current = false;
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch students ${err instanceof Error ? err.message : ''}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [lastQuery, setLastQuery] = useState<{ filters: FilterValue[]; sortField: string; sortDirection: 'asc' | 'desc'; pageNumber: number; pageSize: number } | null>(null);

  // Unified handler for DataTable param changes
  const handleParamsChange = async (params: { filters: FilterValue[], sorting: { id: string; desc: boolean }[], pageNumber: number, pageSize: number }) => {
    const filters = params.filters || [];
    const sorting = params.sorting || [];
    const sortId = sorting[0]?.id || '';
    const sortDirection = sorting[0]?.desc ? 'desc' : 'asc';
    setCurrentPageSize(params.pageSize);
    const previousQuery = lastQuery;
    setLastQuery({ filters, sortField: sortId, sortDirection, pageNumber: params.pageNumber, pageSize: params.pageSize });
    const previousFiltersSignature = previousQuery?.filters?.map(f => `${f.key}:${f.condition}:${f.value}`).join('|') ?? '';
    const currentFiltersSignature = filters.map(f => `${f.key}:${f.condition}:${f.value}`).join('|');
    const sortChanged =
      sortId !== (previousQuery?.sortField ?? '') ||
      sortDirection !== (previousQuery?.sortDirection ?? 'asc');
    const filtersChanged = currentFiltersSignature !== previousFiltersSignature;
    const shouldScroll =
      params.pageNumber !== previousPageNumberRef.current ||
      params.pageSize !== previousPageSizeRef.current ||
      sortChanged ||
      filtersChanged;

    if (shouldScroll) {
      shouldScrollToTopRef.current = true;
    }

    await fetchStudents(filters, sortId, sortDirection, params.pageNumber, params.pageSize);
    scheduleScrollToTopIfNeeded();

    previousPageNumberRef.current = params.pageNumber;
    previousPageSizeRef.current = params.pageSize;

    // Track filter applications (avoid duplicate firing if unchanged)
    const keySignature = Array.from(new Set(filters.map(f => f.key))).sort().join('|');
    if (keySignature !== lastFilterKeysRef.current) {
      trackFiltersChanged({ filterValues: filters });
      lastFilterKeysRef.current = keySignature;
    }
  };

  const handleToggleActiveOnly = async (checked: boolean) => {
    setActiveOnly(checked);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('students-activeOnly', JSON.stringify(checked));
    }
    
    // Update URL parameter
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('activeOnly', checked ? 'true' : 'false');
    const newUrl = `${pathname}?${newSearchParams.toString()}`;
    router.replace(newUrl);
    
    const q = lastQuery;
    if (q) {
      await fetchStudents(q.filters, q.sortField, q.sortDirection, q.pageNumber, q.pageSize, checked);
      previousPageNumberRef.current = q.pageNumber;
      previousPageSizeRef.current = q.pageSize;
      shouldScrollToTopRef.current = true;
      scheduleScrollToTopIfNeeded();
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
    if (totalCount > 5000) {
      setAlertMessage({ 
        type: 'destructive', 
        message: 'Too many students to download. Please filter your results to less than 5000.'
      });
      return;
    }
    const filters = searchParams.get('filters');
    const sort = searchParams.get('sort');
    const columns = searchParams.get('columns') || Object.keys(initialVisibility).filter(key => initialVisibility[key as keyof typeof initialVisibility] === true).join(',');
    let url = `/api/students/download?columns=${columns}&activeOnly=${activeOnly}`;
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
      <div className="flex mb-4 gap-2 justify-end">
        <Switch
          className="cursor-pointer"
          checked={activeOnly}
          onCheckedChange={handleToggleActiveOnly}
        />
        <span className="text-base font-medium text-gray-700">Show active students only</span>
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
          scrollContainerRef={tableScrollRef}
        />
      </div>
    </div>
  );
}

export default StudentsPage
