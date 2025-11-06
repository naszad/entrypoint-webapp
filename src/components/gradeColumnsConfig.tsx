import { StudentGradeInfo } from "@/types/StudentGradeInfo";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { stringToColor } from "@/utils/utils";

export const defaultVisibility: VisibilityState = {
  full_name: true,
  local_course_code: true,
  course_name: true,
  grade_letter: true,
  grade_percent: true,
  grade_code: true,
  updated_at: true,
};

const getUserInitials = (fullName: string): string => {
  if (!fullName) return "";
  const [firstName = "", lastName = ""] = fullName.split(" ");
  const firstInitial = firstName[0] || "";
  const lastInitial = lastName[0] || "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const columns: ColumnDef<StudentGradeInfo>[] = [
  {
    accessorKey: "full_name",
    header: "Student",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div className="py-1 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${stringToColor(row.original.full_name)}`}
        >
          {getUserInitials(row.original.full_name)}
        </div>
        <div>
          <div className="font-medium">{row.original.full_name}</div>
          <div className="text-xs text-gray-500">
            Class of {row.original.graduation_year}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "local_course_code",
    header: "Course Number",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "course_name",
    header: "Course Name",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
  },
  {
    accessorKey: "grade_letter",
    header: "Grade",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.original.grade_letter || '-'}</div>
    ),
  },
  {
    accessorKey: "grade_percent",
    header: "Grade %",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "number",
    },
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.grade_percent ? `${row.original.grade_percent}%` : '-'}
      </div>
    ),
  },
  {
    accessorKey: "grade_code",
    header: "Code",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "multi-select",
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.original.grade_code || '-'}</div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    enableHiding: true,
    meta: {
      enableFiltering: true,
      filterType: "date",
    },
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.updated_at
          ? new Date(row.original.updated_at).toLocaleDateString()
          : '-'}
      </div>
    ),
  },
];

const accessorKeys = columns
  .map((column) => {
    if ("accessorKey" in column && typeof column.accessorKey === "string") {
      return column.accessorKey;
    }

    if ("id" in column && typeof column.id === "string") {
      return column.id;
    }

    return undefined;
  })
  .filter((key): key is string => Boolean(key));

if (accessorKeys.length === 0) {
  throw new Error("Grade columns must define at least one accessorKey.");
}

export const gradeColumnAccessorKeys = accessorKeys as [string, ...string[]];
