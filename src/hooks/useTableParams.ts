import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SortingState } from '@tanstack/react-table';
import { FilterValue } from '@/components/DataTable/DataTable';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const MAX_URL_LENGTH = 1800;

const parseCommaSeparatedValues = (input: string): string[] =>
  input
    .split(',')
    .map((value) => value.trim())
    .filter((value, index, self) => value !== '' && self.indexOf(value) === index);

const formatValuesForStorage = (values: string[]): string => values.join('|');

const formatValuesForDisplay = (value: string): string =>
  value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');

const buildFilterConditionsFromFilters = (
  filters: FilterValue[],
  multiSelectKeys: Set<string>
): Record<string, string> => {
  return filters.reduce<Record<string, string>>((acc, filter) => {
    if (
      filter.key.endsWith('RecentOnly') ||
      filter.key.endsWith('From') ||
      filter.key.endsWith('To')
    ) {
      acc[filter.key] = filter.value;
      return acc;
    }

    if (filter.condition === 'in') {
      if (multiSelectKeys.has(filter.key)) {
        acc[filter.key] = filter.value;
      } else {
        acc[filter.key] = 'in';
      }
      return acc;
    }

    acc[filter.key] = filter.condition;
    return acc;
  }, {});
};

interface UseTableParamsProps {
  onParamsChange?: (params: { filters: FilterValue[], sorting: SortingState, pageNumber: number, pageSize: number }) => void;
  enablePagination?: boolean;
  mostRecentOnly?: boolean;
  multiSelectFilterKeys?: string[];
  onFilterError?: (message: string | null) => void;
}

export function useTableParams({
  onParamsChange,
  enablePagination = false,
  mostRecentOnly = false,
  multiSelectFilterKeys = [],
  onFilterError,
}: UseTableParamsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  
  const generateFilterId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `filter-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const multiSelectKeySet = useMemo(() => new Set(multiSelectFilterKeys), [multiSelectFilterKeys]);


  // Helper function to compare filter arrays
  const compareFilters = useCallback((prev: FilterValue[], current: FilterValue[]) => {
    if (prev.length !== current.length) return false;
    for (let i = 0; i < prev.length; i++) {
      const prevFilter = prev[i];
      const currentFilter = current[i];
      if (prevFilter.key !== currentFilter.key || 
          prevFilter.condition !== currentFilter.condition || 
          prevFilter.value !== currentFilter.value) {
        return false;
      }
    }
    return true;
  }, []);

  // Helper function to compare sorting arrays
  const compareSorting = useCallback((prev: SortingState, current: SortingState) => {
    if (prev.length !== current.length) return false;
    for (let i = 0; i < prev.length; i++) {
      const prevSort = prev[i];
      const currentSort = current[i];
      if (prevSort.id !== currentSort.id || prevSort.desc !== currentSort.desc) {
        return false;
      }
    }
    return true;
  }, []);

  // Helper function to deeply compare params objects
  const compareParams = useCallback((prev: { filters: FilterValue[], sorting: SortingState }, current: { filters: FilterValue[], sorting: SortingState }) => {
    return compareFilters(prev.filters, current.filters) && compareSorting(prev.sorting, current.sorting);
  }, [compareFilters, compareSorting]);

  // Filter state
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<FilterValue[]>(() => {
    const filtersParam = searchParams.get('filters');
    
    if (!filtersParam) return [];

    try {
      const parsed: FilterValue[] = [];
      filtersParam.split(',').forEach(filter => {
        const parts = filter.split(':');
        if (parts.length !== 3) return;
        const [key, condition, value] = parts;
        parsed.push({ id: generateFilterId(), key, condition, value });
      });
      return parsed;
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
        const [key, condition, value] = parts;
        
        // Handle RecentOnly filters 
        if (key.endsWith('RecentOnly')) {
          return { ...acc, [key]: value };
        }
        
        // Handle date range filters (From/To)
        if (key.endsWith('From') || key.endsWith('To')) {
          return { ...acc, [key]: value };
        }
        
        // Handle multi-select filters (condition = 'in')
        if (condition === 'in') {
          if (multiSelectKeySet.has(key)) {
            return { ...acc, [key]: value };
          }
          return { ...acc, [key]: condition };
        }
        
        // Handle regular filters
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

  // Pagination state
  const [pageNumber, setPageNumber] = useState(() => {
    const pageParam = searchParams.get('pageNumber');
    const parsed = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  });
  const [pageSize, setPageSize] = useState(() => {
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
  });

  // Refs
  const filterDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const filterInputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const filterConditionRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  const prevParamsRef = useRef<{
    filters: FilterValue[];
    sorting: SortingState;
    pageNumber: number;
    pageSize: number;
    filterConditions: Record<string, string>;
  }>({
    filters: [],
    sorting: [],
    pageNumber: 1,
    pageSize: 50,
    filterConditions: {},
  });
  const initialLoadRef = useRef(true);

  // Sync filterValues and sorting with URL params when they change
  useEffect(() => {
    // Parse filters from URL
    const filtersParam = searchParams.get('filters');
    let newFilterValues: FilterValue[] = [];
    const newFilterConditions: Record<string, string> = {};
    if (filtersParam) {
      try {
        const parsedFilters: FilterValue[] = [];
        filtersParam.split(',').forEach(filter => {
          const parts = filter.split(':');
          if (parts.length !== 3) return;
          const [key, condition, value] = parts;

          if (key.endsWith('RecentOnly') || key.endsWith('From') || key.endsWith('To')) {
            newFilterConditions[key] = value;
          } else if (condition === 'in') {
          if (multiSelectKeySet.has(key)) {
            newFilterConditions[key] = value;
          } else {
            newFilterConditions[key] = condition;
          }
          } else {
            newFilterConditions[key] = condition;
          }

          parsedFilters.push({ id: generateFilterId(), key, condition, value });
        });
        newFilterValues = parsedFilters;
      } catch (error) {
        console.error('Error parsing filters from URL:', error);
      }
    }

    // Parse sorting from URL
    const sortParam = searchParams.get('sort');
    let newSorting: SortingState = [];
    if (sortParam) {
      const [id, direction] = sortParam.split(':');
      newSorting = [{ id, desc: direction === 'desc' }];
    }

    // Only update if different to avoid unnecessary renders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilterValues(prev => compareFilters(prev, newFilterValues) ? prev : newFilterValues);
    setSorting(prev => compareSorting(prev, newSorting) ? prev : newSorting);
    setFilterConditions(prev => {
      // Only update if different
      const keys = Object.keys(newFilterConditions);
      const prevKeys = Object.keys(prev);
      if (keys.length !== prevKeys.length) return newFilterConditions;
      for (const key of keys) {
        if (prev[key] !== newFilterConditions[key]) return newFilterConditions;
      }
      return prev;
    });
  }, [searchParams, compareFilters, compareSorting, generateFilterId, multiSelectKeySet]);

  // Set input and condition values when filter dropdown opens
  useEffect(() => {
    if (openFilterColumn) {
      const filterValuesForColumn = filterValues.filter(f => f.key.includes(openFilterColumn));    
      
      if (filterValuesForColumn.length > 0) {
        const conditionSelect = filterConditionRefs.current[openFilterColumn];
        const mainFilter = filterValuesForColumn.find(f => f.key === openFilterColumn);
        if (conditionSelect && mainFilter) {
          conditionSelect.value = mainFilter.condition;
        }

        filterValuesForColumn.forEach(filterValue => {
          const input = filterInputRefs.current[filterValue.key];
          if (input) {
            // Do not populate input for is_empty / is_not_empty
            if (mainFilter && (mainFilter.condition === 'is_empty' || mainFilter.condition === 'is_not_empty')) {
              input.value = '';
            } else {
              input.value =
                mainFilter?.condition === 'in'
                  ? formatValuesForDisplay(filterValue.value)
                  : filterValue.value;
            }
          }
        });
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

  // Sync pageNumber and pageSize with URL params when they change
  useEffect(() => {
    // Get values from URL
    const pageParam = searchParams.get('pageNumber');
    const sizeParam = searchParams.get('pageSize');

    // Only update pageNumber if URL param exists, is valid, and different from current state
    if (pageParam) {
      const parsed = parseInt(pageParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed !== pageNumber) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPageNumber(parsed);
      }
    }

    // Only update pageSize if URL param exists, is valid, and different from current state
    if (sizeParam) {
      const parsed = parseInt(sizeParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed !== pageSize) {
        setPageSize(parsed);
      }
    }
  }, [searchParams, pageNumber, pageSize]);

  // Update URL and notify parent when params change
  useEffect(() => {
    const currentParams = { filters: filterValues, sorting, pageNumber, pageSize };
    const currentFilterConditions = buildFilterConditionsFromFilters(filterValues, multiSelectKeySet);

    const newSearchParams = new URLSearchParams();
    // Copy existing params except managed ones
    searchParams.forEach((value, key) => {
      if (
        key !== 'filters' &&
        key !== 'sort' &&
        key !== 'pageNumber' &&
        key !== 'pageSize' &&
        key !== 'mostRecentOnly'
      ) {
        newSearchParams.set(key, value);
      }
    });

    if (filterValues.length > 0) {
      const filtersString = filterValues
        .map((filter) => `${filter.key}:${filter.condition}:${filter.value}`)
        .join(',');
      newSearchParams.set('filters', filtersString);
    }

    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      newSearchParams.set('sort', `${id}:${desc ? 'desc' : 'asc'}`);
    }

    if (enablePagination) {
      newSearchParams.set('pageNumber', String(pageNumber));
      newSearchParams.set('pageSize', String(pageSize));
    }

    if (mostRecentOnly) {
      newSearchParams.set('mostRecentOnly', 'true');
    }

    const newQuery = newSearchParams.toString();
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrlLength = origin ? origin.length + newUrl.length : newUrl.length;

    // Use deep compare for filters/sorting, but always check pageNumber/pageSize
    const paramsChanged =
      initialLoadRef.current ||
      !compareParams(
        { filters: prevParamsRef.current.filters, sorting: prevParamsRef.current.sorting },
        { filters: currentParams.filters, sorting: currentParams.sorting }
      ) ||
      prevParamsRef.current.pageNumber !== currentParams.pageNumber ||
      prevParamsRef.current.pageSize !== currentParams.pageSize;

    if (fullUrlLength > MAX_URL_LENGTH) {
      onFilterError?.('Filters are too large. Please reduce the filter size and try again.');

      // Revert to previous stable state
      setFilterValues(prevParamsRef.current.filters);
      setSorting(prevParamsRef.current.sorting);
      setPageNumber(prevParamsRef.current.pageNumber);
      setPageSize(prevParamsRef.current.pageSize);
      setFilterConditions(prevParamsRef.current.filterConditions);
      setOpenFilterColumn(null);
      return;
    }

    onFilterError?.(null);

    if (paramsChanged) {
      prevParamsRef.current = {
        ...currentParams,
        filterConditions: currentFilterConditions,
      };
      onParamsChange?.(currentParams);
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }

      const currentQuery = searchParams.toString();
      if (currentQuery !== newQuery) {
        router.replace(newUrl);
      }
    }
  }, [
    filterValues,
    sorting,
    pageNumber,
    pageSize,
    onParamsChange,
    pathname,
    router,
    searchParams,
    enablePagination,
    mostRecentOnly,
    compareParams,
    multiSelectKeySet,
    onFilterError,
  ]);

  // Filter handlers
  const handleFilterClick = (columnId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenFilterColumn(openFilterColumn === columnId ? null : columnId);
  };

  const handleApplyFilter = (columnId: string, updatedFilters?: FilterValue[]) => {
    const input = filterInputRefs.current[columnId];
    const conditionSelect = filterConditionRefs.current[columnId];
    
    const fromValue = filterConditions[`${columnId}From`];
    const toValue = filterConditions[`${columnId}To`];
    const recentOnlyValue = filterConditions[`${columnId}RecentOnly`];

    setPageNumber(1);

    // Numeric filters supply the complete set of conditions so replace them wholesale.
    if (updatedFilters) {
      setFilterValues(prev => {
        const withoutColumn = prev.filter(f => f.key !== columnId);
        if (updatedFilters.length === 0) {
          return withoutColumn;
        }
        const normalized = updatedFilters.map(filter => ({
          ...filter,
          id: filter.id ?? generateFilterId(),
        }));
        return [...withoutColumn, ...normalized];
      });
      setFilterConditions(prev => {
        const newState = { ...prev };
        delete newState[columnId];
        return newState;
      });
      setOpenFilterColumn(null);
      return;
    }
    
    if (recentOnlyValue && parseInt(recentOnlyValue) > 0) {
      // Handle RecentOnly filter
      setFilterValues(prev => {
        const newFilters = prev.filter(f => 
          f.key !== `${columnId}From` && 
          f.key !== `${columnId}To` && 
          f.key !== `${columnId}RecentOnly`
        );
        
        newFilters.push({
          id: generateFilterId(),
          key: `${columnId}RecentOnly`,
          value: recentOnlyValue,
          condition: 'in'
        });
        
        return newFilters;
      });
    } else if (fromValue || toValue) {
      setFilterValues(prev => {
        const newFilters = prev.filter(f => 
          f.key !== `${columnId}From` && 
          f.key !== `${columnId}To` && 
          f.key !== `${columnId}RecentOnly`
        );
        
        if (fromValue) {
          newFilters.push({
            id: generateFilterId(),
            key: `${columnId}From`,
            value: fromValue,
            condition: 'gte'
          });
        }
        
        if (toValue) {
          newFilters.push({
            id: generateFilterId(),
            key: `${columnId}To`,
            value: toValue,
            condition: 'lte'
          });
        }
        
        return newFilters;
      });
    } else if (filterConditions[columnId] && filterConditions[columnId].trim() !== '' && !input) {
      // Handle multi-select filter (contains pipe-separated values)
      const multiSelectValue = filterConditions[columnId];
      setFilterValues(prev => {
        const existingFilterIndex = prev.findIndex(f => f.key === columnId);
        const newFilter = {
          id: prev[existingFilterIndex]?.id ?? generateFilterId(),
          key: columnId,
          value: multiSelectValue,
          condition: 'in',
        };
        if (existingFilterIndex >= 0) {
          const newFilters = [...prev];
          newFilters[existingFilterIndex] = newFilter;
          return newFilters;
        }
        return [...prev, newFilter];
      });
    } else {
      const condition = conditionSelect?.value || 'eq';

      // Allow applying when condition is is_empty or is_not_empty even if input is empty
      if (condition === 'is_empty' || condition === 'is_not_empty') {
        setFilterConditions(prev => ({ ...prev, [columnId]: condition }));
        setFilterValues(prev => {
          const existingFilterIndex = prev.findIndex(f => f.key === columnId);
          const newFilter = {
            id: prev[existingFilterIndex]?.id ?? generateFilterId(),
            key: columnId,
            value: 'true',
            condition,
          };
          if (existingFilterIndex >= 0) {
            const newFilters = [...prev];
            newFilters[existingFilterIndex] = newFilter;
            return newFilters;
          }
          return [...prev, newFilter];
        });
      } else if (input && input.value.trim() !== '') {
        const rawValue = input.value;
        if (condition === 'in') {
          const parsedValues = parseCommaSeparatedValues(rawValue);
          if (parsedValues.length === 0) {
            setOpenFilterColumn(null);
            return;
          }
          const storedValue = formatValuesForStorage(parsedValues);
          input.value = parsedValues.join(', ');
          setFilterConditions(prev => ({ ...prev, [columnId]: condition }));
          setFilterValues(prev => {
            const existingFilterIndex = prev.findIndex(f => f.key === columnId);
            const newFilter = {
              id: prev[existingFilterIndex]?.id ?? generateFilterId(),
              key: columnId,
              value: storedValue,
              condition,
            };
            if (existingFilterIndex >= 0) {
              const newFilters = [...prev];
              newFilters[existingFilterIndex] = newFilter;
              return newFilters;
            }
            return [...prev, newFilter];
          });
        } else {
          const trimmedValue = rawValue.trim();
          setFilterConditions(prev => ({ ...prev, [columnId]: condition }));
          setFilterValues(prev => {
            const existingFilterIndex = prev.findIndex(f => f.key === columnId);
            const newFilter = {
              id: prev[existingFilterIndex]?.id ?? generateFilterId(),
              key: columnId,
              value: trimmedValue,
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
      }
    }
    setOpenFilterColumn(null);
  };

  const handleClearFilter = (columnId: string) => {
    const fromValue = filterConditions[`${columnId}From`];
    const toValue = filterConditions[`${columnId}To`];
    const recentOnlyValue = filterConditions[`${columnId}RecentOnly`];
    
    setPageNumber(1);

    if (fromValue || toValue || recentOnlyValue) {
      setFilterValues(prev => prev.filter(f => 
        f.key !== `${columnId}From` && 
        f.key !== `${columnId}To` && 
        f.key !== `${columnId}RecentOnly`
      ));
      setFilterConditions(prev => {
        const newState = { ...prev };
        delete newState[`${columnId}From`];
        delete newState[`${columnId}To`];
        delete newState[`${columnId}RecentOnly`];
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

  const handleRemoveFilter = (filter: FilterValue) => {
    if (filter.key.endsWith('From') || filter.key.endsWith('To') || filter.key.endsWith('RecentOnly')) {
      const baseKey = filter.key.replace(/(?:From|To|RecentOnly)$/, '');
      handleClearFilter(baseKey);
      return;
    }

    setPageNumber(1);

    setFilterValues(prev => prev.filter(f => {
      if (filter.id) {
        if (f.id) {
          return f.id !== filter.id;
        }
        return !(f.key === filter.key && f.condition === filter.condition && f.value === filter.value);
      }
      return !(f.key === filter.key && f.condition === filter.condition && f.value === filter.value);
    }));

    setFilterConditions(prev => {
      const newState = { ...prev };
      delete newState[filter.key];
      return newState;
    });
  };

  const handleClearAllFilters = () => {
    setFilterValues([]);
    setFilterConditions({});
    setOpenFilterColumn(null);
    setPageNumber(1);
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

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage);
  };
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageNumber(1); // Reset to first page on size change
  };

  const applyQuickFilter = useCallback(
    (columnId: string, condition: 'contains', value: string) => {
      setPageNumber(1);
      setFilterValues((prev) => {
        const withoutColumn = prev.filter((filter) => filter.key !== columnId);
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return withoutColumn;
        }

        const existingId = prev.find((filter) => filter.key === columnId)?.id;
        return [
          ...withoutColumn,
          {
            id: existingId ?? generateFilterId(),
            key: columnId,
            condition,
            value: trimmed,
          },
        ];
      });

      setFilterConditions((prev) => {
        const next = { ...prev };
        if (value.trim().length === 0) {
          delete next[columnId];
        } else {
          next[columnId] = condition;
        }
        return next;
      });

      setOpenFilterColumn(null);
    },
    [generateFilterId]
  );

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

    // Pagination state and handlers
    pageNumber,
    pageSize,
    setPageNumber,
    setPageSize,
    handlePageChange,
    handlePageSizeChange,
    applyQuickFilter,
  };
}
