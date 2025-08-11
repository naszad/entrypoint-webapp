import { ColumnMeta } from './DataTable';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/utils';
import { getFilterConditionsByType } from '@/utils/filterConditions';
import { } from 'react';
import { MultiSelectFilter } from './MultiSelectFilter';

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
  filterInputRef?: (el: HTMLInputElement | HTMLSelectElement | null, key?: string) => void;
  filterConditionRef?: (el: HTMLSelectElement | null) => void;
  multiSelectRemoteSource?: (columnId: string) => Promise<{ value: string; label: string }[]>;
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
  multiSelectRemoteSource,
}: FilterDropdownProps) {
  const getFilterConditionOptions = (filterType: string) => {
    return getFilterConditionsByType(filterType);
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
        {meta.filterType !== 'dropdown' && meta.filterType !== 'date' && meta.filterType !== 'multi-select' && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 px-1">Condition</div>
            <select
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterConditions[columnId] || 'eq'}
              onChange={(e) => {
                const value = e.target.value;
                setFilterConditions({ ...filterConditions, [columnId]: value });
              }}
              ref={filterConditionRef}
            >
              {getFilterConditionOptions(meta.filterType || '').map((option) => (
                <option key={option.id} value={option.id}>{option.displayValue}</option>
              ))}
            </select>
          </div>
        )}
        {meta.filterType === 'dropdown' && meta.filterOptions ? (
          <select
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            ref={filterInputRef}
            autoFocus
          >
            <option value="">
              All
            </option>
            {((meta.filterOptions as unknown) as { id: string; displayValue: string }[]).map(option => (
              <option key={option.id} value={option.id}>
                {option.displayValue}
              </option>
            ))}
          </select>
        ) : meta.filterType === 'date' ? (
          <>
            {/* Show Last N Days Input */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
              <span className="text-xs font-medium text-gray-700">Show last</span>
              <Input
                type="number"
                min="1"
                placeholder="30"
                className="w-16 h-7 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterConditions[`${columnId}RecentOnly`] || ''}
                onChange={(e) => {
                  const recentOnlyKey = `${columnId}RecentOnly`;
                  const fromKey = `${columnId}From`;
                  const toKey = `${columnId}To`;
                  const value = e.target.value;
                  
                  // Only allow positive integers
                  if (value === '' || (parseInt(value) > 0 && Number.isInteger(Number(value)))) {
                    if (value && parseInt(value) > 0) {
                      // Clear existing from/to date values and set recent only to the number
                      setFilterConditions({
                        ...filterConditions,
                        [recentOnlyKey]: value,
                        [fromKey]: '',
                        [toKey]: ''
                      });
                    } else {
                      // Clear recent only if empty
                      setFilterConditions({
                        ...filterConditions,
                        [recentOnlyKey]: ''
                      });
                    }
                  }
                  // If invalid input, don't update the state (input will revert)
                }}
              />
              <span className="text-xs font-medium text-gray-700">days data</span>
            </div>
            
            {/* Date Range Inputs */}
            <div className="text-xs font-medium text-gray-500 px-1">{`${headerText} From`}</div>
            <input
              id={`${columnId}From`}
              type="date"
              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                filterConditions[`${columnId}RecentOnly`] ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              ref={(el) => {
                if (filterInputRef) {
                  filterInputRef(el, `${columnId}From`);
                }
              }}
              autoFocus={!filterConditions[`${columnId}RecentOnly`]}
              disabled={!!filterConditions[`${columnId}RecentOnly`]}
              value={filterConditions[`${columnId}From`] || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilterConditions({ 
                  ...filterConditions, 
                  [`${columnId}From`]: value 
                });
              }}
            />
            <div className="text-xs font-medium text-gray-500 px-1">{`${headerText} To`}</div>
            <input
              id={`${columnId}To`}
              type="date"
              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                filterConditions[`${columnId}RecentOnly`] ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              ref={(el) => {
                if (filterInputRef) {
                  filterInputRef(el, `${columnId}To`);
                }
              }}
              disabled={!!filterConditions[`${columnId}RecentOnly`]}
              value={filterConditions[`${columnId}To`] || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilterConditions({ 
                  ...filterConditions, 
                  [`${columnId}To`]: value 
                });
              }}
            />
          </>
        ) : meta.filterType === 'multi-select' ? (
          <MultiSelectFilter
            columnId={columnId}
            headerText={headerText}
            filterConditions={filterConditions}
            setFilterConditions={setFilterConditions}
            multiSelectRemoteSource={multiSelectRemoteSource}
          />
        ) : (
          <>
            <div className="text-xs font-medium text-gray-500 px-1">Value</div>
            <input
              type={meta.filterType === 'number' ? 'number' : 'text'}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Filter ${headerText}`}
              ref={filterInputRef}
              autoFocus
            />
          </>
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
            onClick={() => {
              if (meta.filterType === 'date') {
                const fromValue = filterConditions[`${columnId}From`];
                const toValue = filterConditions[`${columnId}To`];
                const recentOnlyValue = filterConditions[`${columnId}RecentOnly`];
                if (fromValue || toValue || (recentOnlyValue && parseInt(recentOnlyValue) > 0)) {
                  onApply(columnId);
                }
              } else if (meta.filterType === 'multi-select') {
                const multiSelectValue = filterConditions[columnId];
                if (multiSelectValue && multiSelectValue.trim() !== '') {
                  onApply(columnId);
                }
              } else {
                onApply(columnId);
              }
            }}
            variant="primary"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}