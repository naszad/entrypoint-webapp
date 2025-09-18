'use client';
import { createColumns, defaultVisibility as initialVisibility } from "@/components/ReportColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { useState } from "react";
import { useAuth } from '@/context/AuthContext'
import { updateReport, deleteReport } from '@/libs/reportsService';
import { Alert } from "@/components/ui/alert";
import { Report } from "@/types/Models";
import { useRouter } from 'next/navigation';
import { EditReportDialog } from "@/components/EditReportDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ReportsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterValue[]>([]);
  const [currentSortId, setCurrentSortId] = useState('');
  const [currentSortDirection, setCurrentSortDirection] = useState<'asc' | 'desc'>('asc');
  const { user } = useAuth();
  const router = useRouter();

  const handleReportClick = (reportId: string) => {

    const report = reports.find(report => report.report_id === reportId);
    if (report && report.page_name) {

      const params = report.params ? JSON.parse(report.params) : {};

      const url = new URL(window.location.origin);
      url.pathname = report.page_name;
      
      // Dynamically add all params to URL searchParams
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
          url.searchParams.append(key, String(value));
        }
      });
      router.push(url.toString());
    } else {
      // report corrupted do nothing
    }
  };

  const handleRowAction = (reportId: string, action: string) => {
    const report = reports.find(report => report.report_id === reportId);
    if (report) {
      if (action === 'edit') {
        setSelectedReport(report);
        setIsEditDialogOpen(true);
      }
      if (action === 'delete') {
        setSelectedReport(report);
        setIsDeleteDialogOpen(true);
      }
    } else {
      // report corrupted do nothing
    }
  };

  const handleEditSave = async (viewData: { name: string; description: string }) => {
    if (selectedReport) {
      const { name, description } = viewData;
      const { message } = await updateReport({
        reportId: selectedReport.report_id,
        name,
        description,
        userId: user?.user_id || ''
      });
      if (message) {
        setAlertMessage({
          type: 'success',
          message: 'Report updated successfully'
        });
        setIsEditDialogOpen(false);
        await fetchReports(currentFilters, currentSortId, currentSortDirection);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedReport) {
      const { message } = await deleteReport(selectedReport.report_id, user?.user_id || '');
      if (message) {
        setAlertMessage({
          type: 'success',
          message: 'Report deleted successfully'
        });
        setIsDeleteDialogOpen(false);
        await fetchReports(currentFilters, currentSortId, currentSortDirection);
      }
    }
  };

  const fetchReports = async (filters: FilterValue[], sortField: string, sortDirection: 'asc' | 'desc') => {
    try {
      setIsLoading(true);
      const filtersParam = filters.length > 0 ? filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',') : '';
      const url = `/api/reports?filters=${encodeURIComponent(filtersParam)}&sortField=${encodeURIComponent(sortField)}&sortDirection=${encodeURIComponent(sortDirection)}&pageNumber=1&pageSize=10&userId=${encodeURIComponent(user?.user_id || '')}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        setAlertMessage({ 
          type: 'destructive', 
          message: errorData.error || 'Failed to fetch reports.'
        });
      }
      const result = await response.json();
      setReports(result);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch reports ${err instanceof Error ? err.message : ''}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = async (params: { filters: FilterValue[], sorting: { id: string; desc: boolean }[] }) => {
    const filters = params.filters || [];
    const sortId = params.sorting?.[0]?.id || '';
    const sortDirection = params.sorting?.[0]?.desc ? 'desc' : 'asc';
    
    setCurrentFilters(filters);
    setCurrentSortId(sortId);
    setCurrentSortDirection(sortDirection);
    
    await fetchReports(filters, sortId, sortDirection);
  }

  const columns = createColumns({ 
    onReportClick: handleReportClick,
    onRowAction: handleRowAction
  });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-700">Reports</h3>
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
          columns={columns} 
          data={reports} 
          className="w-full"
          defaultVisibility={initialVisibility}
          onParamsChange={handleFilterApply}
          isLoading={isLoading}
        />
      </div>

      <EditReportDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleEditSave}
        reportId={selectedReport?.report_id}
        initialName={selectedReport?.name || ''}
        initialDescription={selectedReport?.description || ''}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Do you wish to delete report &apos;{selectedReport?.name}&apos;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              No
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReportsPage