"use client";

import { Student } from "@/models/Students";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";

export const defaultVisibility: VisibilityState = {
  fullName: true,
  email: true,
  gradeLevel: true,
  gender: false,
  enrollmentStatus: false,
  homeroomName: false,
  updatedAt: true,
};

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "fullName",
    header: "Student",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div className="py-1">
        <div className="font-medium">
          {row.original.fullName}
        </div>
        <div className="text-xs text-gray-500">Class of  {row.original.graduationYear}</div>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "gradeLevel",
    header: "Grade",
    meta: {
      enableFiltering: true,
      filterType: "number",
    },
    cell: ({ row }) => {
      return row.original.gradeLevel || "N/A";
    },
  },
  {
    accessorKey: "gender",
    header: "Gender",
    meta: {
      enableFiltering: true,
      filterType: "dropdown",
      filterOptions: [{id: "male", displayValue: "Male"}, {id: "female", displayValue: "Female"}],
    },
  },
  {
    accessorKey: "enrollmentStatus",
    header: "Status",
    meta: {
      enableFiltering: true,
      filterType: "dropdown",
      filterOptions: [{id: 'active', displayValue: 'Active'}, {id: 'inactive', displayValue: 'Inactive'}],
    },
  },
  {
    accessorKey: "homeroomName",
    header: "Homeroom",
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    meta: {
      enableFiltering: true,
      enableSorting: true,
      filterType: "date",
    },
    cell: ({ row }) => {
      const date = row.original.updatedAt;
      return date ? new Date(date).toLocaleString() : "N/A";
    },
  },
];
