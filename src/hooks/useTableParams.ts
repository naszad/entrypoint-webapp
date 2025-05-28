import { useState, useRef, useEffect } from 'react';
import { SortingState } from '@tanstack/react-table';
import { FilterValue } from '@/components/DataTable/DataTable';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseTableParamsProps {
  onParamsChange?: (params: { filters: FilterValue[], sorting: SortingState }) => void;
}

export function useTableParams({ onParamsChange }: UseTableParamsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  // Filter state
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<FilterValue[]>(() => {
    const filtersParam = searchParams.get('filters');
    if (!filtersParam) return [];

    try {
      return filtersParam.split(',').map(filter => {
        const parts = filter.split(':');
        if (parts.length !== 3) return null;
        const [key, condition, value] = parts;
        return { key, condition, value };
      }).filter((filter): filter is FilterValue => filter !== null);
    } catch (error) {
      console.error('Error parsing filters from URL:', error);
      return [];
    }
  });
  const [filterConditions, setFilterConditions] = useState<Record<string, string>>(() => {
    const filtersParam = searchParams.get('filters');
    if (!filtersParam) return {};

    try {
      return filtersParam.split(',').reduce((acc, filter) => {
        const parts = filter.split(':');
        if (parts.length !== 3) return acc;
        const [key, condition] = parts;
        return { ...acc, [key]: condition };
      }, {});
    } catch (error) {
      console.error('Error parsing filter conditions from URL:', error);
      return {};
    }
  });

  // Sort state
  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam) {
      const [id, direction] = sortParam.split(':');
      return [{ id, desc: direction === 'desc' }];
    }
    return [];
  });

  // Refs
  const filterDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const filterInputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const filterConditionRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  const prevParamsRef = useRef<{ filters: FilterValue[], sorting: SortingState }>({ filters: [], sorting: [] });
  const initialLoadRef = useRef(true);

  // Set input and condition values when filter dropdown opens
  useEffect(() => {
    if (openFilterColumn) {
      const filterValuesForColumn = filterValues.filter(f => f.key.includes(openFilterColumn));    
      
      if (filterValuesForColumn.length > 0) {
        filterValuesForColumn.forEach(filterValue => {
          const input = filterInputRefs.current[filterValue.key];
          if (input) {
            input.value = filterValue.value;
          }
        });

        const conditionSelect = filterConditionRefs.current[openFilterColumn];
        if (conditionSelect) {
          const mainFilter = filterValuesForColumn.find(f => f.key === openFilterColumn);
          if (mainFilter) {
            conditionSelect.value = mainFilter.condition;
          }
        }
      }
    }
  }, [openFilterColumn, filterValues]);

  // Handle click outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      const isFilterButtonClick = Object.values(filterButtonRefs.current).some(
        button => button?.contains(target)
      );

      const isFilterDropdownClick = Object.values(filterDropdownRefs.current).some(
        dropdown => dropdown?.contains(target)
      );

      if (!isFilterButtonClick && !isFilterDropdownClick) {
        setOpenFilterColumn(null);
      }
    };

    if (openFilterColumn) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilterColumn]);

  // Update URL and notify parent when params change
  useEffect(() => {
    const currentParams = { filters: filterValues, sorting };
    
    if (initialLoadRef.current || JSON.stringify(prevParamsRef.current) !== JSON.stringify(currentParams)) {
      prevParamsRef.current = currentParams;
      onParamsChange?.(currentParams);
      
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }
      
      const newSearchParams = new URLSearchParams();
      
      // Copy existing params except filters and sort
      searchParams.forEach((value, key) => {
        if (key !== 'filters' && key !== 'sort') {
          newSearchParams.set(key, value);
        }
      });
      
      // Add filters
      if (filterValues.length > 0) {
        const filtersString = filterValues
          .map(filter => `${filter.key}:${filter.condition}:${filter.value}`)
          .join(',');
        newSearchParams.set('filters', filtersString);
      }

      // Add sort
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        newSearchParams.set('sort', `${id}:${desc ? 'desc' : 'asc'}`);
      }

      const query = newSearchParams.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(newUrl);
    }
  }, [filterValues, sorting, onParamsChange, pathname, router, searchParams]);

  // Filter handlers
  const handleFilterClick = (columnId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenFilterColumn(openFilterColumn === columnId ? null : columnId);
  };

  const handleApplyFilter = (columnId: string) => {
    const input = filterInputRefs.current[columnId];
    const conditionSelect = filterConditionRefs.current[columnId];
    
    const fromValue = filterConditions[`${columnId}From`];
    const toValue = filterConditions[`${columnId}To`];
    
    if (fromValue || toValue) {
      setFilterValues(prev => {
        const newFilters = prev.filter(f => f.key !== `${columnId}From` && f.key !== `${columnId}To`);
        
        if (fromValue) {
          newFilters.push({
            key: `${columnId}From`,
            value: fromValue,
            condition: 'gte'
          });
        }
        
        if (toValue) {
          newFilters.push({
            key: `${columnId}To`,
            value: toValue,
            condition: 'lte'
          });
        }
        
        return newFilters;
      });
    } else if (input && input.value) {
      const condition = conditionSelect?.value || 'eq';
      setFilterConditions(prev => ({ ...prev, [columnId]: condition }));
      setFilterValues(prev => {
        const existingFilterIndex = prev.findIndex(f => f.key === columnId);
        const newFilter = {
          key: columnId,
          value: input.value,
          condition,
        };
        if (existingFilterIndex >= 0) {
          const newFilters = [...prev];
          newFilters[existingFilterIndex] = newFilter;
          return newFilters;
        }
        return [...prev, newFilter];
      });
    }
    setOpenFilterColumn(null);
  };

  const handleClearFilter = (columnId: string) => {
    const fromValue = filterConditions[`${columnId}From`];
    const toValue = filterConditions[`${columnId}To`];
    
    if (fromValue || toValue) {
      setFilterValues(prev => prev.filter(f => f.key !== `${columnId}From` && f.key !== `${columnId}To`));
      setFilterConditions(prev => {
        const newState = { ...prev };
        delete newState[`${columnId}From`];
        delete newState[`${columnId}To`];
        return newState;
      });
    } else {
      setFilterValues(prev => prev.filter(f => f.key !== columnId));
      setFilterConditions(prev => {
        const newState = { ...prev };
        delete newState[columnId];
        return newState;
      });
    }
    setOpenFilterColumn(null);
  };

  const handleRemoveFilter = (columnId: string) => {
    const fromValue = filterConditions[`${columnId}From`];
    const toValue = filterConditions[`${columnId}To`];
    
    if (fromValue || toValue) {
      setFilterValues(prev => prev.filter(f => f.key !== `${columnId}From` && f.key !== `${columnId}To`));
      setFilterConditions(prev => {
        const newState = { ...prev };
        delete newState[`${columnId}From`];
        delete newState[`${columnId}To`];
        return newState;
      });
    } else {
      setFilterValues(prev => prev.filter(f => f.key !== columnId));
      setFilterConditions(prev => {
        const newState = { ...prev };
        delete newState[columnId];
        return newState;
      });
    }
  };

  const handleClearAllFilters = () => {
    setFilterValues([]);
    setFilterConditions({});
    setOpenFilterColumn(null);
  };

  // Sort handlers
  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    setSorting([{ id: columnId, desc: direction === 'desc' }]);
    setOpenFilterColumn(null);
  };

  const getCurrentSortDirection = (columnId: string): 'asc' | 'desc' | null => {
    const currentSort = sorting.find(sort => sort.id === columnId);
    if (!currentSort) return null;
    return currentSort.desc ? 'desc' : 'asc';
  };

  return {
    // Filter state and handlers
    openFilterColumn,
    filterValues,
    filterConditions,
    filterDropdownRefs,
    filterButtonRefs,
    filterInputRefs,
    filterConditionRefs,
    setOpenFilterColumn,
    setFilterConditions,
    handleFilterClick,
    handleApplyFilter,
    handleClearFilter,
    handleRemoveFilter,
    handleClearAllFilters,
    
    // Sort state and handlers
    sorting,
    setSorting,
    handleSort,
    getCurrentSortDirection,
  };
} 