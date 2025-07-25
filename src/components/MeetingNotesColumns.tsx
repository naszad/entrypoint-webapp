"use client";

import { MeetingNoteInfo } from "@/types/MeetingNoteInfo";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { format } from 'date-fns'

export const defaultVisibility: VisibilityState = {
  studentName: true,
  createdAt: true,
  summary: true,
};


export const columns: ColumnDef<MeetingNoteInfo>[] = [
  {
    accessorKey: "studentName",
    header: "Student",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date of Meeting",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      enableSorting: true,
      filterType: "date",
    },
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return date ? format(new Date(date), 'MMMM d, yyyy') : "N/A";
    },
  },
  {
    accessorKey: "summary",
    header: "Summary",
    enableHiding: false,
    meta: {
      enableFiltering: false,
      filterType: "text",
    },
  },
];
