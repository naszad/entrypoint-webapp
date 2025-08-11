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
import { TableHeader as NewTableHeader } from "./TableHeader";
import { useTableParams } from "@/hooks/useTableParams";
import Pagination from "./Pagination";

export type ColumnMeta = {
  enableFiltering?: boolean;
  enableSorting?: boolean;
  filterType?: 'text' | 'number' | 'date' | 'dropdown' | 'multi-select';
  filterOptions?: string[];
  header?: string;
}

export interface FilterValue {
  key: string;
  value: string;
  condition: string;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total?: number;
  className?: string;
  actions?: ActionItem[];
  onActionItemClicked?: (actionId: string) => void;
  onRowClick?: (row: TData) => void;
  defaultVisibility?: VisibilityState;
  onParamsChange?: (params: { filters: FilterValue[], sorting: { id: string; desc: boolean }[], pageNumber: number, pageSize: number }) => void;
  isLoading?: boolean;
  enablePagination?: boolean;
  onPageChange?: (pageNumber: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  multiSelectRemoteSource?: (columnId: string) => Promise<{ value: string; label: string }[]>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  total,
  className,
  actions = [],
  onActionItemClicked,
  onRowClick,
  defaultVisibility = {},
  onParamsChange,
  isLoading = false,
  enablePagination = false,
  onPageChange,
  onPageSizeChange,
  pageSize,
  multiSelectRemoteSource,
}: DataTableProps<TData, TValue>) {
  const { columnVisibility, setColumnVisibility } = useColumnVisibility(defaultVisibility);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const {
    openFilterColumn,
    filterValues,
    filterConditions,
    filterDropdownRefs,
    filterButtonRefs,
    filterInputRefs,
    filterConditionRefs,
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
    pageNumber,
    pageSize: tablePageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useTableParams({
    onParamsChange,
    enablePagination,
  });

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

  return (
    <div
      className={cn(
        "rounded-lg border shadow-sm bg-white flex flex-col overflow-hidden",
        "h-[calc(100vh-140px)]", // Fixed height based on viewport minus header/padding
        className
      )}
    >
      {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      
      {/* Toolbar - Fixed height */}
      <div className="flex-shrink-0">
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
      </div>

      {/* Table content - Flexible height with internal scroll */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
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
                        onSort={handleSort}
                        currentSortDirection={getCurrentSortDirection(column.id)}
                        isLastColumn={isLastColumn}
                        filterButtonRef={(el) => {
                          filterButtonRefs.current[column.id] = el;
                        }}
                        filterDropdownRef={(el) => {
                          filterDropdownRefs.current[column.id] = el;
                        }}
                        filterInputRef={(el, key) => {
                          if (key) {
                            filterInputRefs.current[key] = el;
                          } else {
                            filterInputRefs.current[column.id] = el;
                          }
                        }}
                        filterConditionRef={(el) => {
                          filterConditionRefs.current[column.id] = el;
                        }}
                        multiSelectRemoteSource={multiSelectRemoteSource}
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
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      "hover:bg-gray-50 transition-colors cursor-pointer",
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
                    className="h-full text-center text-gray-500 italic"
                  >
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      {isLoading ? 'Loading...' : 'No data available.'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination - Fixed at bottom */}
      {enablePagination && !!total && total > 0 && (
        <div className="flex-shrink-0 border-t bg-white">
          <Pagination
            total={total}
            currentPage={pageNumber}
            onPageChange={onPageChange || handlePageChange}
            onPageSizeChange={onPageSizeChange || handlePageSizeChange}
            pageSize={pageSize || tablePageSize}
          />
        </div>
      )}

    </div>
  );
}
