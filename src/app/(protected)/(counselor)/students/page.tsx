'use client';
import { columns, defaultVisibility as initialVisibility } from "@/components/StudentColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { ActionItem } from "@/components/DataTable/DataTableToolbar";
import { useState, useEffect } from "react";
import { StudentInfo } from "@/types/StudentInfo";
import { SaveViewDialog } from "@/components/SaveViewDialog";
import { useAuth } from '@/context/AuthContext'

const StudentsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { user } = useAuth();
  // const [pageNumber, setPageNumber] = useState<number>(1);
  // const [pageSize, setPageSize] = useState<number>(10);

  const fetchFilteredStudents = async (
    filters: FilterValue[],
    sortInfo: { sortField: string; sortDirection: 'asc' | 'desc' },
    pagingInfo: { pageNumber: number; pageSize: number }
  ): Promise<StudentInfo[]> => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filters,
        sortInfo,
        pagingInfo
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch filtered students');
    }

    const data = await res.json();
    return data;
  };

  const handleFilterApply = async (newFilterValues: FilterValue[]) => {
    let filteredStudents: StudentInfo[] = [];
    try {
      setIsLoading(true);
      setFilterValues(newFilterValues);
      filteredStudents = await fetchFilteredStudents(
        newFilterValues,
        { sortField, sortDirection },
        { pageNumber: 1, pageSize: 10 }
      );
      console.log('Filtered students:', filteredStudents);
    } catch (err) {
      console.error('Failed to fetch filtered students', err);
    } finally {
      setStudents(filteredStudents);
      setIsLoading(false);
    }
  }

  const handleSort = async (sorting: { id: string; desc: boolean }[]) => {
    try {
      setIsLoading(true);
      const newSortField = sorting[0]?.id || '';
      const newSortDirection = sorting[0]?.desc ? 'desc' : 'asc';
      
      setSortField(newSortField);
      setSortDirection(newSortDirection);

      const sortedStudents = await fetchFilteredStudents(
        filterValues,
        { sortField: newSortField, sortDirection: newSortDirection },
        { pageNumber: 1, pageSize: 10 }
      );
      
      setStudents(sortedStudents);
    } catch (err) {
      console.error('Failed to sort students', err);
    } finally {
      setIsLoading(false);
    }
  }

  // const handlePageChange = async (newPageNumber: number) => {
  //   try {
  //     setIsLoading(true);
  //     setPageNumber(newPageNumber);
  //     const newStudents = await fetchFilteredStudents(
  //       filterValues,
  //       { sortField, sortDirection },
  //       { pageNumber: newPageNumber, pageSize }
  //     );
  //     setStudents(newStudents);
  //   } catch (err) {
  //     console.error('Failed to fetch page', err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  // const handlePageSizeChange = async (newPageSize: number) => {
  //   try {
  //     setIsLoading(true);
  //     setPageSize(newPageSize);
  //     setPageNumber(1); // Reset to first page when changing page size
  //     const newStudents = await fetchFilteredStudents(
  //       filterValues,
  //       { sortField, sortDirection },
  //       { pageNumber: 1, pageSize: newPageSize }
  //     );
  //     setStudents(newStudents);
  //   } catch (err) {
  //     console.error('Failed to change page size', err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  const action: ActionItem[] = [];

  const handleSaveView = async (viewData: {
    name: string;
    description: string;
    params: string;
  }) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...viewData, pageName: 'students', userId: user?.userId }),
      });

      if (!res.ok) {
        throw new Error('Failed to save view');
      }

      const data = await res.json();
      console.log('View saved successfully:', data);
    } catch (err) {
      console.error('Failed to save view:', err);
    }
  };

  // Fetch initial students data
  useEffect(() => {
    const fetchInitialStudents = async () => {
      let initialStudents: StudentInfo[] = [];
      try {
        setIsLoading(true);
        initialStudents = await fetchFilteredStudents(
          [],
          { sortField: '', sortDirection: 'asc' },
          { pageNumber: 1, pageSize: 10 }
        );
      } catch (err) {
        console.error('Failed to fetch initial students', err);
      } finally {
        setStudents(initialStudents);
        setIsLoading(false);
      }
    };

    fetchInitialStudents();
  }, []);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-700">Students</h3>
      </div>
      <div className="flex gap-2 mb-4 justify-end">
        <SaveViewDialog onSave={handleSaveView} />
      </div>
      <div className="flex-1 w-full h-50">
        <DataTable 
          columns={columns} 
          data={students} 
          className="w-full"
          actions={action}
          defaultVisibility={initialVisibility}
          onFilterApply={handleFilterApply}
          onSort={handleSort}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default StudentsPage