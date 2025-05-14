import { useState, useRef, useEffect } from 'react';
import { SortingState } from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';

interface UseSortProps {
  onSort?: (sorting: { id: string; desc: boolean }[]) => void;
}

export const useSort = ({ onSort }: UseSortProps) => {
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam) {
      const [id, direction] = sortParam.split(':');
      return [{ id, desc: direction === 'desc' }];
    }
    return [];
  });
  const prevSortingRef = useRef<SortingState>([]);

  useEffect(() => {
    if (JSON.stringify(prevSortingRef.current) !== JSON.stringify(sorting)) {
      onSort?.(sorting);
      prevSortingRef.current = sorting;
      
      // Update URL query parameter
      const url = new URL(window.location.href);
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        url.searchParams.set('sort', `${id}:${desc ? 'desc' : 'asc'}`);
      } else {
        url.searchParams.delete('sort');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [sorting, onSort]);

  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    setSorting([{ id: columnId, desc: direction === 'desc' }]);
  };

  const getCurrentSortDirection = (columnId: string): 'asc' | 'desc' | null => {
    const currentSort = sorting.find(sort => sort.id === columnId);
    if (!currentSort) return null;
    return currentSort.desc ? 'desc' : 'asc';
  };

  return {
    sorting,
    setSorting,
    handleSort,
    getCurrentSortDirection,
  };
}; 