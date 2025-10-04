"use client";

import { StudentInfo } from "@/types/StudentInfo";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import Image from "next/image";
import { stringToColor } from "@/utils/utils";

export const defaultVisibility: VisibilityState = {
  fullName: true,
  email: true,
  gradeLevel: true,
  gpa: true,
  gender: false,
  enrollmentStatus: true,
  homeroomName: false,
  studentNumber: true,
  updatedAt: false,
};

const getUserInitials = (user: StudentInfo | null): string => {
  if (!user) return '';
  const firstInitial = user.firstName?.[0] || '';
  const lastInitial = user.lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const columns: ColumnDef<StudentInfo>[] = [
  {
    accessorKey: "fullName",
    header: "Student",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div className="py-1 flex items-center gap-3">
        {row.original.photoUrl ? (
          <Image
            src={row.original.photoUrl}
            alt={row.original.fullName}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${stringToColor(row.original.fullName)}`}>
            {getUserInitials(row.original)}
          </div>
        )}
        <div>
          <div className="font-medium">
            {row.original.fullName}
          </div>
          <div className="text-xs text-gray-500">Class of  {row.original.graduationYear}</div>
        </div>
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
    accessorKey: "gpa",
    header: "GPA",
    meta: {
      enableFiltering: true,
      filterType: "number",
    },
    cell: ({ row }) => {
      const gpa = row.original.gpa;
      return gpa ? gpa.toFixed(2) : "N/A";
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
    accessorKey: "studentNumber",
    header: "Student Number",
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
