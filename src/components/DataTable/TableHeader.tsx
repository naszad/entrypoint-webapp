import { Header, flexRender } from '@tanstack/react-table';
import { Funnel, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/utils';
import { ColumnMeta, FilterValue } from './DataTable';
import { FilterDropdown } from './FilterDropdown';
import { TableHead } from '../ui/table';
import { Input } from '../ui/input';

interface TableHeaderProps<TData> {
  header: Header<TData, unknown>;
  isFilterable: boolean;
  isFilterOpen: boolean;
  filterConditions: Record<string, string>;
  setFilterConditions: (value: Record<string, string>) => void;
  onFilterClick: (columnId: string, event: React.MouseEvent) => void;
  onApplyFilter: (columnId: string, filters?: FilterValue[]) => void;
  onClearFilter: (columnId: string) => void;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  currentSortDirection?: 'asc' | 'desc' | null;
  isLastColumn?: boolean;
  filterButtonRef: (el: HTMLButtonElement | null) => void;
  filterDropdownRef: (el: HTMLDivElement | null) => void;
  filterInputRef?: (el: HTMLInputElement | HTMLSelectElement | null, key?: string) => void;
  filterConditionRef: (el: HTMLSelectElement | null) => void;
  multiSelectRemoteSource?: (columnId: string) => Promise<{ value: string; label: string }[]>;
  activeFilters: FilterValue[];
  enableQuickSearch?: boolean;
  onQuickFilter?: (columnId: string, condition: 'contains', value: string) => void;
}

export function TableHeader<TData>({
  header,
  isFilterable,
  isFilterOpen,
  filterConditions,
  setFilterConditions,
  onFilterClick,
  onApplyFilter,
  onClearFilter,
  onSort,
  currentSortDirection,
  isLastColumn,
  filterButtonRef,
  filterDropdownRef,
  filterInputRef,
  filterConditionRef,
  multiSelectRemoteSource,
  activeFilters,
  enableQuickSearch = false,
  onQuickFilter,
}: TableHeaderProps<TData>) {
  const column = header.column;
  const meta = column.columnDef.meta as ColumnMeta;
  const headerText = typeof column.columnDef.header === 'string' 
    ? column.columnDef.header 
    : column.id;

  const filtersForColumn = useMemo(() => {
    return activeFilters.filter((filter) => filter.key === column.id);
  }, [activeFilters, column.id]);

  const containsFilterValue = useMemo(() => {
    const containsFilter = filtersForColumn.find(
      (filter) => filter.condition === 'contains' && filter.key === column.id
    );
    return containsFilter?.value ?? '';
  }, [filtersForColumn, column.id]);

  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [quickSearchValue, setQuickSearchValue] = useState(containsFilterValue);
  const quickSearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isQuickSearchOpen) {
      quickSearchInputRef.current?.focus();
      quickSearchInputRef.current?.select();
    }
  }, [isQuickSearchOpen]);

  const applyQuickSearch = useCallback(
    (value: string) => {
      if (!onQuickFilter) return;
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        onQuickFilter(column.id, 'contains', '');
        return;
      }
      if (trimmed.length < 3) {
        return;
      }
      onQuickFilter(column.id, 'contains', trimmed);
    },
    [column.id, onQuickFilter]
  );

  useEffect(() => {
    if (!isQuickSearchOpen) return;
    const trimmed = quickSearchValue.trim();
    if (trimmed.length === 0) {
      applyQuickSearch('');
      return;
    }
    if (trimmed.length < 3) return;

    const timeout = setTimeout(() => {
      applyQuickSearch(quickSearchValue);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [applyQuickSearch, isQuickSearchOpen, quickSearchValue]);

  const handleQuickSearchToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsQuickSearchOpen((prev) => {
      const next = !prev;
      if (!prev) {
        setQuickSearchValue(containsFilterValue);
      }
      return next;
    });
  };

  const handleQuickSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyQuickSearch(quickSearchValue);
    }
    if (event.key === 'Escape') {
      setIsQuickSearchOpen(false);
      setQuickSearchValue(containsFilterValue);
    }
  };

  const handleQuickSearchClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    setQuickSearchValue('');
    applyQuickSearch('');
    setIsQuickSearchOpen(false);
  };

  const renderSortIcon = () => {
    if (meta?.disableSorting) return null;
    
    if (currentSortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1 text-gray-600" />;
    }
    if (currentSortDirection === 'desc') {
      return <ArrowDown className="h-3 w-3 ml-1 text-gray-600" />;
    }
    return null;
  };

  return (
    <TableHead
      className={cn(
        "py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 transition-colors duration-200 relative",
        isFilterable && "cursor-pointer"
      )}
      onClick={(e) => {
        if (isFilterable && !isFilterOpen && !isQuickSearchOpen) {
          onFilterClick(column.id, e);
        }
      }}
    >
      {enableQuickSearch && isQuickSearchOpen ? (
        <div
          className="flex items-center gap-2 w-full px-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Input
            ref={quickSearchInputRef}
            value={quickSearchValue}
            onChange={(event) => setQuickSearchValue(event.target.value)}
            onKeyDown={handleQuickSearchKeyDown}
            placeholder="Search student name"
            className="h-8 text-sm px-3"
          />
          <button
            onClick={handleQuickSearchClear}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-600 focus:outline-none"
            aria-label="Close quick search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {enableQuickSearch && (
            <button
              onClick={handleQuickSearchToggle}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-700 transition-colors"
              aria-label="Quick search students"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
          {renderSortIcon()}
          {isFilterable && (
            <button
              ref={filterButtonRef}
              onClick={(e) => onFilterClick(column.id, e)}
              className={cn(
                "p-1 rounded-full hover:bg-gray-200 text-gray-600 focus:outline-none transition-transform",
                isFilterOpen && "rotate-180"
              )}
            >
              <Funnel className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      {isFilterOpen && isFilterable && (
        <div ref={filterDropdownRef}>
          <FilterDropdown
            columnId={column.id}
            meta={meta}
            headerText={headerText}
            filterConditions={filterConditions}
            setFilterConditions={setFilterConditions}
            onApply={onApplyFilter}
            onClear={onClearFilter}
            onSort={onSort}
            currentSortDirection={currentSortDirection}
            isLastColumn={isLastColumn}
            filterInputRef={filterInputRef}
            filterConditionRef={filterConditionRef}
            multiSelectRemoteSource={multiSelectRemoteSource}
            activeFilters={filtersForColumn}
          />
        </div>
      )}
    </TableHead>
  );
} 
