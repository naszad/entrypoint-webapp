import { useState, useRef, useEffect } from 'react';
import { FilterValue } from '@/components/DataTable/DataTable';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseTableFiltersProps {
  onFilterApply?: (filterValues: FilterValue[]) => void;
}

export function useTableFilters({ onFilterApply }: UseTableFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
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
  const filterDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const filterInputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const filterConditionRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  const prevFilterValuesRef = useRef<FilterValue[]>([]);

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

        // Set condition select value if it exists (for non-date filters)
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

  useEffect(() => {
    if (JSON.stringify(prevFilterValuesRef.current) !== JSON.stringify(filterValues)) {
      onFilterApply?.(filterValues);
      prevFilterValuesRef.current = filterValues;
      
      // Create a new URLSearchParams object
      const newSearchParams = new URLSearchParams();
      
      // Copy all existing parameters except 'filters'
      searchParams.forEach((value, key) => {
        if (key !== 'filters') {
          newSearchParams.set(key, value);
        }
      });
      
      // Add the new filters parameter if there are any filters
      if (filterValues.length > 0) {
        const filtersString = filterValues
          .map(filter => `${filter.key}:${filter.condition}:${filter.value}`)
          .join(',');
        newSearchParams.set('filters', filtersString);
      }

      // Construct the new URL
      const query = newSearchParams.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(newUrl);
    }
  }, [filterValues, onFilterApply, pathname, router, searchParams]);

  const handleFilterClick = (columnId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenFilterColumn(openFilterColumn === columnId ? null : columnId);
  };

  const handleApplyFilter = (columnId: string) => {
    const input = filterInputRefs.current[columnId];
    const conditionSelect = filterConditionRefs.current[columnId];
    
    // Check if this is a date filter by looking for From/To values in filterConditions
    const fromValue = filterConditions[`${columnId}From`];
    const toValue = filterConditions[`${columnId}To`];
    
    if (fromValue || toValue) {
      setFilterValues(prev => {
        const newFilters = prev.filter(f => f.key !== `${columnId}From` && f.key !== `${columnId}To`);
        
        if (fromValue) {
          newFilters.push({
            key: `${columnId}From`,
            value: fromValue,
            condition: 'Greater than or equal to'
          });
        }
        
        if (toValue) {
          newFilters.push({
            key: `${columnId}To`,
            value: toValue,
            condition: 'Less than or equal to'
          });
        }
        
        return newFilters;
      });
    } else if (input && input.value) {
      const condition = conditionSelect?.value || 'Equals';
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
    // Check if this is a date filter by looking for From/To values
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
    // Check if this is a date filter by looking for From/To values
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

  return {
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
  };
} 