import { ColumnMeta } from './DataTable';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/utils';

interface FilterDropdownProps {
  columnId: string;
  meta: ColumnMeta;
  headerText: string;
  filterConditions: Record<string, string>;
  setFilterConditions: (value: Record<string, string>) => void;
  onApply: (columnId: string) => void;
  onClear: (columnId: string) => void;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  currentSortDirection?: 'asc' | 'desc' | null;
  isLastColumn?: boolean;
  filterInputRef?: (el: HTMLInputElement | HTMLSelectElement | null) => void;
  filterConditionRef?: (el: HTMLSelectElement | null) => void;
}

export function FilterDropdown({
  columnId,
  meta,
  headerText,
  filterConditions,
  setFilterConditions,
  onApply,
  onClear,
  onSort,
  currentSortDirection,
  isLastColumn,
  filterInputRef,
  filterConditionRef,
}: FilterDropdownProps) {
  const getFilterConditionOptions = (filterType: string) => {
    switch (filterType) {
      case 'text':
        return ['Contains', 'Equals', 'Starts with', 'Ends with'];
      case 'number':
        return ['Equals', 'Greater than', 'Less than'];
      case 'date':
        return ['Equals', 'Before', 'After'];
      default:
        return ['Equals'];
    }
  };

  const getSortDirectionDESCPlaceHolder = (meta: ColumnMeta) => {
    if (!meta) return '';

    switch (meta.filterType) {
      case 'text':
        return '(A to Z)';
      case 'date':
        return '(New to Old)';
      case 'number':
        return '(High to Low)';
      default:
        return '';
    }
  };

  const getSortDirectionASCPlaceHolder = (meta: ColumnMeta) => {
    if (!meta) return '';

    switch (meta.filterType) {
      case 'text':
        return '(Z to A)';
      case 'date':
        return '(Old to New)';
      case 'number':
        return '(Low to High)';
      default:
        return '';
    }
  };

  const getSortButtonClass = (direction: 'asc' | 'desc') => {
    const baseClass = "w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded flex items-center gap-2";
    if (currentSortDirection === direction) {
      return `${baseClass} bg-gray-100`;
    }
    return baseClass;
  };

  return (
    <div className={cn(
      "absolute top-full mt-1 bg-white border rounded-md shadow-lg p-2 z-50 min-w-[270px]",
      isLastColumn ? "right-0" : "left-0"
    )}>
      <div className="space-y-2">
        {meta.enableSorting && (
          <div className="space-y-1 border-b pb-2">
            <button
              onClick={() => onSort(columnId, 'asc')}
              className={getSortButtonClass('asc')}
            >
              <ChevronDown className="h-3 w-3 rotate-180" />
              Sort by {headerText} {getSortDirectionDESCPlaceHolder(meta)}
            </button>
            <button
              onClick={() => onSort(columnId, 'desc')}
              className={getSortButtonClass('desc')}
            >
              <ChevronDown className="h-3 w-3" />
              Sort by {headerText} {getSortDirectionASCPlaceHolder(meta)}
            </button>
          </div>
        )}
        <div className="text-xs font-medium text-gray-800 px-1">Filter by {headerText}</div>
        {meta.filterType !== 'dropdown' && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 px-1">Condition</div>
            <select
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterConditions[columnId] || 'Equals'}
              onChange={(e) => {
                const value = e.target.value;
                setFilterConditions({ ...filterConditions, [columnId]: value });
              }}
              ref={filterConditionRef}
            >
              {getFilterConditionOptions(meta.filterType || '').map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )}
        <div className="text-xs font-medium text-gray-500 px-1">Value</div>
        {meta.filterType === 'dropdown' && meta.filterOptions ? (
          <select
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            ref={filterInputRef}
            autoFocus
          >
            <option value="">All</option>
            {meta.filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : meta.filterType === 'date' ? (
          <input
            type="date"
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            ref={filterInputRef}
            autoFocus
          />
        ) : (
          <input
            type={meta.filterType === 'number' ? 'number' : 'text'}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Filter ${headerText}`}
            ref={filterInputRef}
            autoFocus
          />
        )}
        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant='outline'
            size='xsm'
            onClick={() => onClear(columnId)}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            Clear
          </Button>
          <Button
            size='xsm'
            onClick={() => onApply(columnId)}
            className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
} 