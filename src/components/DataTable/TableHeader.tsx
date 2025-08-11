import { Header, flexRender } from '@tanstack/react-table';
import { Funnel, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/utils';
import { ColumnMeta } from './DataTable';
import { FilterDropdown } from './FilterDropdown';
import { TableHead } from '../ui/table';

interface TableHeaderProps<TData> {
  header: Header<TData, unknown>;
  isFilterable: boolean;
  isFilterOpen: boolean;
  filterConditions: Record<string, string>;
  setFilterConditions: (value: Record<string, string>) => void;
  onFilterClick: (columnId: string, event: React.MouseEvent) => void;
  onApplyFilter: (columnId: string) => void;
  onClearFilter: (columnId: string) => void;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  currentSortDirection?: 'asc' | 'desc' | null;
  isLastColumn?: boolean;
  filterButtonRef: (el: HTMLButtonElement | null) => void;
  filterDropdownRef: (el: HTMLDivElement | null) => void;
  filterInputRef?: (el: HTMLInputElement | HTMLSelectElement | null, key?: string) => void;
  filterConditionRef: (el: HTMLSelectElement | null) => void;
  multiSelectRemoteSource?: (columnId: string) => Promise<{ value: string; label: string }[]>;
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
}: TableHeaderProps<TData>) {
  const column = header.column;
  const meta = column.columnDef.meta as ColumnMeta;
  const headerText = typeof column.columnDef.header === 'string' 
    ? column.columnDef.header 
    : column.id;

  const renderSortIcon = () => {
    if (!meta?.enableSorting) return null;
    
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
        if (isFilterable && !isFilterOpen) {
          onFilterClick(column.id, e);
        }
      }}
    >
      <div className="flex items-center gap-1">
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
          />
        </div>
      )}
    </TableHead>
  );
} 