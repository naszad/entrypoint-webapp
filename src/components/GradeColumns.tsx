"use client";

import { StudentGradeInfo } from "@/types/StudentGradeInfo";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import Image from "next/image";
import { stringToColor } from "@/utils/utils";
import { StudentInfo } from "@/types/StudentInfo";

export const defaultVisibility: VisibilityState = {
  fullName: true,
  localCourseCode: true,
  courseName: true,
  gradeLetter: true,
  gradePercentage: true,
  gradeCode: true,
  updatedAt: true,
};

const getUserInitials = (student: StudentInfo | null): string => {
  if (!student) return '';
  const firstInitial = student.firstName?.[0] || '';
  const lastInitial = student.lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const columns: ColumnDef<StudentGradeInfo>[] = [
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
        {row.original.student?.photoUrl ? (
          <Image
            src={row.original.student?.photoUrl}
            alt={row.original.student?.fullName}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${stringToColor(row.original.student?.fullName)}`}>
            {getUserInitials(row.original.student)}
          </div>
        )}
        <div>
          <div className="font-medium">
            {row.original.student?.fullName}
          </div>
          <div className="text-xs text-gray-500">Class of  {row.original.student?.graduationYear}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "course.localCourseCode",
    header: "Course Number",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "course.name",
    header: "Course Name",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "gradeLetter",
    header: "Grade",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.gradeLetter || '-'}
      </div>
    ),
  },
  {
    accessorKey: "gradePercentage",
    header: "Grade %",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "number",
    },
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.gradePercentage ? `${row.original.gradePercentage}%` : '-'}
      </div>
    ),
  },
  {
    accessorKey: "gradeCode",
    header: "Code",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "multi-select",
    },
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.gradeCode || '-'}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      enableSorting: true,
      filterType: "date",
    },
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleDateString() : '-'}
      </div>
    ),
  },
];
