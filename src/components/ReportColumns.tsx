"use client";

import { Report } from "@/types/Models";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { Button } from "./ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const defaultVisibility: VisibilityState = {
  name: true,
  description: true,
  updatedAt: true,
};

type ReportColumnsProps = {
  onReportClick: (reportId: string) => void;
  onRowAction?: (reportId: string, action: string) => void;
};

export const createColumns = ({ onReportClick, onRowAction }: ReportColumnsProps): ColumnDef<Report>[] => [
  {
    accessorKey: "name",
    header: "Report Name",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div 
        className="py-1 cursor-pointer hover:text-blue-600"
        onClick={() => onReportClick(row.original.report_id)}
      >
        <div className="font-medium">
          {row.original.name}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "updated_at",
    header: "Last Updated",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      enableSorting: true,
      filterType: "date",
    },
    cell: ({ row }) => {
      const date = row.original.updated_at;
      return date ? new Date(date).toLocaleString() : "N/A";
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <div className="flex justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRowAction?.(row.original.report_id, 'edit')}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRowAction?.(row.original.report_id, 'delete')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
