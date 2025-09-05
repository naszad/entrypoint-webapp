"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { StudentAbsenceInfo } from "@/types/StudentAbsences";

export const defaultVisibility: VisibilityState = {
    absenceDate: true,
    yearName: true,
    sisCode: true,
    normalizedAbsenceCode: true,
    createdAt: true,
    updatedAt: true,
};

export const columns: ColumnDef<StudentAbsenceInfo>[] = [
  {
    accessorKey: "absenceDate",
    header: "Date",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      enableSorting: true,
      filterType: "date",
    },
    cell: ({ row }) => {
        const date = row.original.absenceDate;
        return date ? new Date(date).toLocaleString() : "N/A";
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
    accessorKey: "sisCode",
    header: "Absence Code",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.sisCode || '-'}
      </div>
    ),
  },
  {
    accessorKey: "normalizedAbsenceCode",
    header: "Type",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
        <div className="font-medium">
          {row.original.normalizedAbsenceCode || '-'}
        </div>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Recorded At",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      enableSorting: true,
      filterType: "date",
    },
    cell: ({ row }) => {
        const date = row.original.createdAt;
        return date ? new Date(date).toLocaleString() : "N/A";
    },
  },
];
