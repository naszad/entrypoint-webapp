"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/utils";
import { useState } from "react";
import {
  Settings,
  MoreVertical,
  Check,
  LockKeyhole,
  X,
} from "lucide-react";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

export interface ActionItem {
  id: string;
  icon?: React.ReactNode;
  label?: string;
  title?: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  actions?: ActionItem[];
  onActionItemClicked?: (actionId: string) => void;
  defaultVisibility?: VisibilityState;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  actions = [],
  onActionItemClicked,
  defaultVisibility = {},
}: DataTableProps<TData, TValue>) {

  const { columnVisibility, setColumnVisibility } = useColumnVisibility(defaultVisibility);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  return (
    <div
      className={cn(
        "rounded-lg border shadow-sm bg-white h-full flex flex-col overflow-auto",
        className
      )}
    >
      {/* Toolbar */}
      <div className="h-10 min-h-10 border-b px-4 flex items-center justify-end bg-gray-50">
        <div className="flex items-center space-x-1">
          {onActionItemClicked &&
            actions.map((action) => (
              <div key={action.id} className="border-r border-gray-200">
                <button
                  onClick={() => onActionItemClicked(action.id)}
                  className={`p-1.5 rounded hover:bg-gray-200 text-gray-600 focus:outline-none flex items-center gap-1 ${
                    action.label ? "px-2" : "rounded-full"
                  }`}
                  title={action.title}
                >
                  {action.icon || <MoreVertical className="h-4 w-4" />}
                  {action.label && (
                    <span className="text-sm">{action.label}</span>
                  )}
                </button>
              </div>
            ))}
          <div className="relative">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600 focus:outline-none"
              title="Column settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {showColumnSettings && (
              <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg py-1 z-50 w-56">
                <div className="px-3 py-2 text-sm font-semibold border-b">
                  Toggle Columns
                </div>
                {table.getAllColumns().map((column) => (
                  <div
                    key={column.id}
                    className={`px-3 py-1.5 flex items-center ${
                      !column.getCanHide()
                        ? ""
                        : "cursor-pointer hover:bg-gray-100"
                    }`}
                    onClick={() =>
                      column.toggleVisibility(!column.getIsVisible())
                    }
                  >
                    <div className="mr-2">
                      {!column.getCanHide() ? (
                        <LockKeyhole className="h-4 w-4 text-gray-400" />
                      ) : column.getIsVisible() ? (
                        <Check className="h-4 w-4 text-blue-500" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm">
                      {column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 transition-colors duration-200"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
