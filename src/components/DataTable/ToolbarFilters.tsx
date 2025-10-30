import { useRef, MouseEvent } from "react";
import { X } from "lucide-react";
import { FilterPill } from "./FilterPill";
import { FilterValue } from "./DataTable";
import { getDisplayValueById } from '@/utils/filterConditions';

interface ToolbarFiltersProps {
  filterValues: FilterValue[];
  getColumnHeader: (filter: FilterValue) => string | undefined;
  getColumnValue: (filter: FilterValue) => string | undefined;
  onRemoveFilter: (filter: FilterValue) => void;
  onClearAllFilters: () => void;
}

export function ToolbarFilters({
  filterValues,
  getColumnHeader,
  getColumnValue,
  onRemoveFilter,
  onClearAllFilters,
}: ToolbarFiltersProps) {
  const activeFiltersRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!activeFiltersRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - activeFiltersRef.current.offsetLeft;
    scrollLeft.current = activeFiltersRef.current.scrollLeft;
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !activeFiltersRef.current) return;
    e.preventDefault();
    const x = e.pageX - activeFiltersRef.current.offsetLeft;
    const walk = x - startX.current;
    activeFiltersRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="flex items-center flex-1 min-w-0">
      {filterValues.length > 1 && (
        <button
          onClick={onClearAllFilters}
          className="inline-flex items-center justify-center p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full text-sm shrink-0 mr-2"
          title="Clear all filters"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div
        ref={activeFiltersRef}
        className="overflow-x-auto whitespace-nowrap cursor-grab active:cursor-grabbing flex items-center gap-2 min-w-0"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {filterValues.map((filter) => (
          <FilterPill
            key={filter.id ?? `${filter.key}-${filter.condition}-${filter.value}`}
            filter={filter}
            label={getColumnHeader(filter) ?? filter.key}
            value={getColumnValue(filter) ?? filter.value}
            condition={getDisplayValueById(filter.condition)}
            onRemove={onRemoveFilter}
          />
        ))}
      </div>
    </div>
  );
}
