"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { StudentTardyInfo } from "@/types/StudentTardies";

export const defaultVisibility: VisibilityState = {
    courseName: true,
    yearName: true,
    termName: true,
    tardies: true,
};

export const columns: ColumnDef<StudentTardyInfo>[] = [
  {
    accessorKey: "courseName",
    header: "Course",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.courseName}</div>
        <div className="text-xs text-gray-500">{row.original.courseNumber}</div>
      </div>
    ),
  },
  {
    accessorKey: "termName",
    header: "Term",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "yearName",
    header: "School Year",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "tardies",
    header: "Tardies",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "number",
    },
    cell: ({ row }) => (
      <div className="font-bold">
        {row.original.tardies}
      </div>
    ),
  }
];
