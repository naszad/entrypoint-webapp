"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/utils";
import { useState } from "react";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { DataTableToolbar, ActionItem } from "./DataTableToolbar";
import { useTableFilters } from "@/hooks/useTableFilters";
import { TableHeader as NewTableHeader } from "./TableHeader";
import { useSort } from "@/hooks/useSort";

export type ColumnMeta = {
  enableFiltering?: boolean;
  enableSorting?: boolean;
  filterType?: 'text' | 'number' | 'date' | 'dropdown';
  filterOptions?: string[];
  header?: string;
}

export interface FilterValue {
  key: string;
  value: string;
  condition: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  actions?: ActionItem[];
  onActionItemClicked?: (actionId: string) => void;
  defaultVisibility?: VisibilityState;
  onFilterApply?: (filterValues: FilterValue[]) => void;
  onSort?: (sorting: { id: string; desc: boolean }[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  actions = [],
  onActionItemClicked,
  defaultVisibility = {},
  onFilterApply,
  onSort,
}: DataTableProps<TData, TValue>) {
  const { columnVisibility, setColumnVisibility } = useColumnVisibility(defaultVisibility);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const { sorting, setSorting, handleSort, getCurrentSortDirection } = useSort({ onSort });

  const {
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
  } = useTableFilters({ onFilterApply });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    state: {
      columnVisibility,
      sorting,
    },
  });

  const handleSortWithFilter = (columnId: string, direction: 'asc' | 'desc') => {
    handleSort(columnId, direction);
    setOpenFilterColumn(null);
  };

  return (
    <div
      className={cn(
        "rounded-lg border shadow-sm bg-white h-full flex flex-col overflow-auto",
        className
      )}
    >
      <DataTableToolbar
        table={table}
        filterValues={filterValues}
        actions={actions}
        onActionItemClicked={onActionItemClicked}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        showColumnSettings={showColumnSettings}
        setShowColumnSettings={setShowColumnSettings}
      />

      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const column = header.column;
                  const meta = column.columnDef.meta as ColumnMeta;
                  const isFilterable = meta?.enableFiltering ?? false;
                  const isFilterOpen = openFilterColumn === column.id;
                  const isLastColumn = index === headerGroup.headers.length - 1;

                  return (
                    <NewTableHeader
                      key={header.id}
                      header={header}
                      isFilterable={isFilterable}
                      isFilterOpen={isFilterOpen}
                      filterConditions={filterConditions}
                      setFilterConditions={setFilterConditions}
                      onFilterClick={handleFilterClick}
                      onApplyFilter={handleApplyFilter}
                      onClearFilter={handleClearFilter}
                      onSort={handleSortWithFilter}
                      currentSortDirection={getCurrentSortDirection(column.id)}
                      isLastColumn={isLastColumn}
                      filterButtonRef={(el) => {
                        filterButtonRefs.current[column.id] = el;
                      }}
                      filterDropdownRef={(el) => {
                        filterDropdownRefs.current[column.id] = el;
                      }}
                      filterInputRef={(el) => {
                        filterInputRefs.current[column.id] = el;
                      }}
                      filterConditionRef={(el) => {
                        filterConditionRefs.current[column.id] = el;
                      }}
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-gray-500 italic"
                >
                  No data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
