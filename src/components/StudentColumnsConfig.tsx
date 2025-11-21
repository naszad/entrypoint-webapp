import { StudentInfo } from "@/types/StudentInfo";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import Image from "next/image";
import { stringToColor } from "@/utils/utils";

/**
 * Column definitions drive both the data table and the AI tooling. Each column can expose
 * `meta.ai` to describe how the filter tool should map natural language constraints into query
 * parameters. A minimal config looks like:
 *
 * ```ts
 * meta: {
 *   enableFiltering: true,
 *   filterType: "text",
 *   ai: {
 *     valueType: "string",
 *     operators: ["contains", "eq"],
 *     synonyms: ["nickname"],
 *     promptAppend: "Prefer eq when the user insists on an exact match.",
 *     hiddenFromDefaultView: true,
 *     queryKey: "nickname",
 *     sortKey: null,
 *     recentParam: "nicknameRecentOnly",
 *   },
 * }
 * ```
 *
 * Attribute reference:
 * - `valueType`: Controls the coercion strategy (`string` | `number` | `date`).
 * - `operators`: Which comparison operators the column supports. See `filterStudentsTool` for the full list.
 *   Common values include `contains`, `eq`, range operators like `gte`, and `in` for multi-value lists.
 *   When using `in`, provide a comma-delimited list; the tool normalizes it into the pipe-delimited format the table expects.
 * - `synonyms`: Optional surface forms the AI router can match against when users reference this column.
 * - `promptAppend`: Extra guidance appended to the system prompt when this column is involved.
 * - `hiddenFromDefaultView`: When true, the column stays hidden unless the tool explicitly reveals it.
 * - `queryKey`: Optional override for the backend parameter name. Defaults to `accessorKey`.
 * - `sortKey`: Override for sorting parameter. Defaults to `accessorKey`; set to `null` to disable sorting.
 * - `recentParam`: Name of the boolean toggle used when applying `recent` operators (e.g., `createdAtRecentOnly`).
 */
export const defaultVisibility: VisibilityState = {
  fullName: true,
  email: true,
  gradeLevel: true,
  gpa: true,
  gender: false,
  enrollmentStatus: true,
  homeroomName: false,
  studentNumber: true,
  lunchId: false,
  stateStudentNumber: false,
  race: true,
  dateOfBirth: false,
  graduationYear: false,
  createdAt: false,
  updatedAt: false,
};

const getUserInitials = (user: StudentInfo | null): string => {
  if (!user) return "";
  const firstInitial = user.firstName?.[0] || "";
  const lastInitial = user.lastName?.[0] || "";
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
      enableQuickSearch: true,
      ai: {
        valueType: "string",
        operators: ["contains", "notContains", "isEmpty", "isNotEmpty"],
        synonyms: ["student name", "name"],
        promptAppend: "Use contains for partial name searches. If the user supplies only one name component, still filter on fullName using that substring.",
      },
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
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${stringToColor(row.original.fullName)}`}
          >
            {getUserInitials(row.original)}
          </div>
        )}
        <div>
          <div className="font-medium">{row.original.fullName}</div>
          <div className="text-xs text-gray-500">
            Class of {row.original.graduationYear}
          </div>
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
      ai: {
        valueType: "string",
        operators: ["contains", "notContains", "isEmpty", "isNotEmpty"],
        synonyms: ["email", "email address"],
      },
    },
  },
  {
    accessorKey: "gradeLevel",
    header: "Grade",
    meta: {
      enableFiltering: true,
      filterType: "number",
      ai: {
        valueType: "number",
        operators: ["eq", "gte", "lte", "in"],
        synonyms: ["grade", "grade level"],
        promptAppend: "When users reference a range of grades, emit separate filters using gte for the lower bound and lte for the upper bound.",
      },
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
      ai: {
        valueType: "number",
        operators: ["eq", "gte", "lte", "notEq"],
        synonyms: ["gpa", "grade point average"],
        promptAppend: "Represent GPA ranges by emitting multiple filters on the same field (e.g., gte for the minimum and lte for the maximum).",
      },
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
      filterOptions: [
        { id: "male", displayValue: "Male" },
        { id: "female", displayValue: "Female" },
      ],
      ai: {
        valueType: "string",
        operators: ["eq", "notEq", "isEmpty", "isNotEmpty", "in"],
        synonyms: ["gender"],
      },
    },
  },
  {
    accessorKey: "enrollmentStatus",
    header: "Status",
    meta: {
      enableFiltering: true,
      filterType: "dropdown",
      filterOptions: [
        { id: "Active", displayValue: "Active" },
        { id: "Inactive", displayValue: "Inactive" },
      ],
      ai: {
        valueType: "string",
        operators: ["eq", "notEq", "in"],
        synonyms: ["status", "enrollment status"],
        promptAppend: "Remember to set activeOnly=false when the user explicitly includes inactive students, or activeOnly=true when they insist on only active students.",
      },
    },
  },
  {
    accessorKey: "homeroomName",
    header: "Homeroom",
    meta: {
      enableFiltering: true,
      filterType: "text",
      ai: {
        valueType: "string",
        operators: ["contains", "notContains", "isEmpty", "isNotEmpty", "in"],
        synonyms: ["homeroom", "homeroom name", "teacher"],
      },
    },
  },
  {
    accessorKey: "studentNumber",
    header: "Student Number",
    meta: {
      enableFiltering: true,
      filterType: "text",
      ai: {
        valueType: "string",
        operators: ["contains", "eq", "notContains", "in"],
        synonyms: ["student number", "student id", "student identifier"],
      },
    },
  },
  {
    accessorKey: "lunchId",
    header: "Lunch ID",
    meta: {
      enableFiltering: true,
      filterType: "text",
      ai: {
        valueType: "string",
        operators: ["contains", "notContains", "isEmpty", "isNotEmpty", "in"],
        synonyms: ["lunch id", "lunch number"],
      },
    },
  },
  {
    accessorKey: "stateStudentNumber",
    header: "State Student Number",
    meta: {
      enableFiltering: true,
      filterType: "text",
      ai: {
        valueType: "string",
        operators: ["contains", "notContains", "eq", "in"],
        synonyms: ["state id", "state student number"],
      },
    },
  },
  {
    accessorKey: "race",
    header: "Race",
    meta: {
      enableFiltering: true,
      filterType: "text",
      ai: {
        valueType: "string",
        operators: ["contains", "notContains", "isEmpty", "isNotEmpty", "in"],
        synonyms: ["race", "ethnicity"],
      },
    },
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    meta: {
      enableFiltering: true,
      filterType: "date",
      ai: {
        queryKey: "date_of_birth",
        valueType: "date",
        operators: ["gte", "lte", "ageGte", "ageLte", "ageEq"],
        synonyms: ["date of birth", "dob", "birthday"],
        promptAppend: "For age-based requests, convert the age to date_of_birth filters using ageGte/ageLte/ageEq operators. Age equals means you should emit both gte and lte boundaries for that birth year.",
      },
    },
    cell: ({ row }) => {
      const date = row.original.dateOfBirth;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
  {
    accessorKey: "graduationYear",
    header: "Graduation Year",
    meta: {
      enableFiltering: true,
      filterType: "number",
      ai: {
        valueType: "number",
        operators: ["eq", "gte", "lte", "in"],
        synonyms: ["graduation year", "grad year", "class year"],
      },
    },
    cell: ({ row }) => (
      <div style={{ textAlign: "center", width: "80%" }}>
        {row.original.graduationYear}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    meta: {
      enableFiltering: true,
      filterType: "date",
      ai: {
        valueType: "date",
        operators: ["gte", "lte", "recent"],
        synonyms: ["created", "added", "registered"],
        promptAppend: "When the user references students created recently, prefer the recent operator with the number of days (e.g., recent:7 for the last week).",
        hiddenFromDefaultView: true,
        recentParam: "createdAtRecentOnly",
      },
    },
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    meta: {
      enableFiltering: true,
      filterType: "date",
      ai: {
        valueType: "date",
        operators: ["gte", "lte", "recent"],
        synonyms: ["updated", "modified", "changed"],
        promptAppend: "Use the recent operator when the user refers to updates within the last N days.",
        recentParam: "updatedAtRecentOnly",
      },
    },
    cell: ({ row }) => {
      const date = row.original.updatedAt;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
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
  throw new Error("Student columns must define at least one accessorKey.");
}

export const studentColumnAccessorKeys = accessorKeys as [string, ...string[]];
