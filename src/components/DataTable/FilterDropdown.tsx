import { useEffect, useMemo, useState } from 'react';
import { ColumnMeta, FilterValue } from './DataTable';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/utils/utils';
import { getFilterConditionsByType } from '@/utils/filterConditions';
import { MultiSelectFilter } from './MultiSelectFilter';

interface FilterDropdownProps {
  columnId: string;
  meta: ColumnMeta;
  headerText: string;
  filterConditions: Record<string, string>;
  setFilterConditions: (value: Record<string, string>) => void;
  onApply: (columnId: string, filters?: FilterValue[]) => void;
  onClear: (columnId: string) => void;
  onSort: (columnId: string, direction: 'asc' | 'desc') => void;
  currentSortDirection?: 'asc' | 'desc' | null;
  isLastColumn?: boolean;
  filterInputRef?: (el: HTMLInputElement | HTMLSelectElement | null, key?: string) => void;
  filterConditionRef?: (el: HTMLSelectElement | null) => void;
  multiSelectRemoteSource?: (columnId: string) => Promise<{ value: string; label: string }[]>;
  activeFilters: FilterValue[];
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
  activeFilters,
}: FilterDropdownProps) {
  type NumberFilterDraft = {
    id: string;
    condition: string;
    value: string;
  };

  const parseCommaSeparatedValues = (input: string) =>
    input
      .split(',')
      .map((value) => value.trim())
      .filter((value, index, self) => value !== '' && self.indexOf(value) === index);

  const formatValuesForDisplay = (value: string) =>
    value
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');

  const formatValuesForStorage = (values: string[]) => values.join('|');

  const getFilterConditionOptions = (filterType: string) => {
    return getFilterConditionsByType(filterType);
  };

  const requiresValue = (condition: string) => {
    return condition !== 'is_empty' && condition !== 'is_not_empty';
  };

  const createDraftId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `filter-${Math.random().toString(36).slice(2, 10)}`;
  };

  const numberFilterOptions = useMemo(() => getFilterConditionOptions('number'), []);
  const currentFilterOptions = useMemo(
    () => getFilterConditionOptions(meta.filterType || ''),
    [meta.filterType]
  );

  const getSelectedConditionForColumn = () => {
    const options = new Set(currentFilterOptions.map((option) => option.id));
    const storedCondition = filterConditions[columnId];
    if (storedCondition && options.has(storedCondition)) {
      return storedCondition;
    }
    const activeCondition = activeFilters.find(
      (filter) => filter.key === columnId
    )?.condition;
    if (activeCondition && options.has(activeCondition)) {
      return activeCondition;
    }
    return options.has('eq') ? 'eq' : currentFilterOptions[0]?.id ?? 'eq';
  };

  const selectedCondition = getSelectedConditionForColumn();
  const isInCondition = selectedCondition === 'in';

  const existingNumberFilters = useMemo(() => {
    if (meta.filterType !== 'number') {
      return [] as FilterValue[];
    }
    return activeFilters.filter((filter) => filter.key === columnId);
  }, [activeFilters, columnId, meta.filterType]);

  const [numberDrafts, setNumberDrafts] = useState<NumberFilterDraft[]>(() => {
    if (existingNumberFilters.length === 0) {
      return [{ id: createDraftId(), condition: 'gte', value: '' }];
    }
    return existingNumberFilters.map((filter) => ({
      id: filter.id ?? createDraftId(),
      condition: filter.condition,
      value: filter.condition === 'in' ? formatValuesForDisplay(filter.value) : filter.value,
    }));
  });

  useEffect(() => {
    if (meta.filterType !== 'number') {
      return;
    }

    if (existingNumberFilters.length === 0) {
      setNumberDrafts([{ id: createDraftId(), condition: 'gte', value: '' }]);
      return;
    }

    setNumberDrafts(
      existingNumberFilters.map((filter) => ({
        id: filter.id ?? createDraftId(),
        condition: filter.condition,
        value: filter.condition === 'in' ? formatValuesForDisplay(filter.value) : filter.value,
      }))
    );
  }, [existingNumberFilters, meta.filterType]);

  const handleAddNumberDraft = () => {
    const existingConditions = new Set(numberDrafts.map((draft) => draft.condition));
    const preferredOrder = ['gte', 'lte', 'gt', 'lt', 'eq', 'not'];
    const nextCondition = preferredOrder.find((option) => !existingConditions.has(option)) || 'gte';
    setNumberDrafts((prev) => [...prev, { id: createDraftId(), condition: nextCondition, value: '' }]);
  };

  const handleUpdateNumberDraft = (draftId: string, updates: Partial<NumberFilterDraft>) => {
    setNumberDrafts((prev) =>
      prev.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              ...updates,
              value: updates.condition && !requiresValue(updates.condition) ? '' : updates.value ?? draft.value,
            }
          : draft
      )
    );
  };

  const handleRemoveNumberDraft = (draftId: string) => {
    setNumberDrafts((prev) => {
      const updated = prev.filter((draft) => draft.id !== draftId);
      return updated.length > 0 ? updated : [{ id: createDraftId(), condition: 'gte', value: '' }];
    });
  };

  const handleApplyNumberFilters = () => {
    const normalizedFilters = numberDrafts.reduce<FilterValue[]>((acc, draft) => {
      if (requiresValue(draft.condition) && draft.value.trim() === '') {
        return acc;
      }

      if (draft.condition === 'in') {
        const parsedValues = parseCommaSeparatedValues(draft.value);
        if (parsedValues.length === 0) {
          return acc;
        }
        acc.push({
          id: draft.id,
          key: columnId,
          condition: draft.condition,
          value: formatValuesForStorage(parsedValues),
        });
        return acc;
      }

      acc.push({
        id: draft.id,
        key: columnId,
        condition: draft.condition,
        value: requiresValue(draft.condition) ? draft.value.trim() : 'true',
      });

      return acc;
    }, []);

    onApply(columnId, normalizedFilters);
  };

  const renderNumberFilterControls = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">Conditions</span>
        <Button
          type="button"
          size="xsm"
          variant="outline"
          onClick={handleAddNumberDraft}
          className="flex items-center gap-1 px-2"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {numberDrafts.map((draft) => (
          <div key={draft.id} className="flex items-center gap-2">
            <select
              className="min-w-[200px] flex-none px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={draft.condition}
              onChange={(event) =>
                handleUpdateNumberDraft(draft.id, { condition: event.target.value })
              }
            >
              {numberFilterOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayValue}
                </option>
              ))}
            </select>
            {requiresValue(draft.condition) && (
              <Input
                type={draft.condition === 'in' ? 'text' : 'number'}
                step="any"
                className="w-24 flex-none px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={draft.condition === 'in' ? '1, 2, 3' : 'Value'}
                value={draft.value}
                onChange={(event) =>
                  handleUpdateNumberDraft(draft.id, { value: event.target.value })
                }
              />
            )}
            {numberDrafts.length > 1 && (
              <button
                type="button"
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => handleRemoveNumberDraft(draft.id)}
                aria-label="Remove condition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );


  const getSortDirectionDESCPlaceHolder = (meta: ColumnMeta) => {
    if (!meta) return '';

    switch (meta.filterType) {
      case 'text':
        return '(A to Z)';
      case 'date':
        return '(Old to New)';
      case 'number':
        return '(Low to High)';
      default:
        return '(A to Z)';
    }
  };

  const getSortDirectionASCPlaceHolder = (meta: ColumnMeta) => {
    if (!meta) return '';

    switch (meta.filterType) {
      case 'text':
        return '(Z to A)';
      case 'date':
        return '(New to Old)';
      case 'number':
        return '(High to Low)';
      default:
        return '(Z to A)';
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
        {!meta.disableSorting && (
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
        {meta.filterType !== 'dropdown' && meta.filterType !== 'date' && meta.filterType !== 'multi-select' && meta.filterType !== 'number' && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 px-1">Condition</div>
            <select
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCondition}
              onChange={(e) => {
                const value = e.target.value;
                setFilterConditions({ ...filterConditions, [columnId]: value });
              }}
              ref={filterConditionRef}
            >
              {currentFilterOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.displayValue}</option>
              ))}
            </select>
          </div>
        )}
        {meta.filterType === 'number' && renderNumberFilterControls()}
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
        ) : meta.filterType === 'number' ? (
          null
        ) : (
          <>
            <div className="text-xs font-medium text-gray-500 px-1">Value</div>
            <input
              type="text"
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                isInCondition
                  ? 'Enter comma-separated values'
                  : `Filter ${headerText}`
              }
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
              if (meta.filterType === 'number') {
                handleApplyNumberFilters();
              } else if (meta.filterType === 'date') {
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