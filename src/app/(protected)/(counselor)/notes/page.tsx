'use client';
import { columns, defaultVisibility as initialVisibility } from "@/components/MeetingNotesColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { ActionItem } from "@/components/DataTable/DataTableToolbar";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext'
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter, useSearchParams } from 'next/navigation';
import { MeetingNoteInfo } from "@/types/MeetingNoteInfo";

const MeetingNotesPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNoteInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const fetchMeetingNotes = async (
    filters: FilterValue[], 
    sortField: string, 
    sortDirection: 'asc' | 'desc',
    pageNumber: number = 1,
    pageSize: number = 50
  ) => {
    try {      
      setIsLoading(true);
      const filtersParam = filters.length > 0 ? filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',') : '';
      let queryParams = `?userId=${user?.user_id}&filters=${encodeURIComponent(filtersParam)}`;
      if (sortField) {
        queryParams += `&sort=${encodeURIComponent(sortField)}:${encodeURIComponent(sortDirection)}`;
      }
      const url = `/api/meeting-notes${queryParams}&pageNumber=${pageNumber}&pageSize=${pageSize}&fetchWithCount=true`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch meeting notes'
        });
        return;
      }

      setMeetingNotes(data.data);
      setTotalCount(data.count);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch meeting notes ${err instanceof Error ? err.message : ''}`
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
    await fetchMeetingNotes(filters, sortId, sortDirection, params.pageNumber, params.pageSize);
  };

  const action: ActionItem[] = [];

  const handleRowClick = (meetingNote: MeetingNoteInfo) => {
    router.push(`/students/${meetingNote.studentId}/meeting-notes/${meetingNote.meetingNoteId}`);
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
        <h3 className="text-2xl font-bold text-gray-700">Meeting Notes</h3>
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
          data={meetingNotes} 
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

export default MeetingNotesPage;