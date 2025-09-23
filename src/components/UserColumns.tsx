"use client";

import { UserInfo } from "@/types/UserInfo";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import Image from "next/image";
import { stringToColor } from "@/utils/utils";
import { Trash2 } from "lucide-react";

export const defaultVisibility: VisibilityState = {
  fullName: true,
  email: true,
  updatedAt: true,
  actions: true,
};

const getUserInitials = (user: UserInfo | null): string => {
  if (!user) return '';
  const firstInitial = user.first_name?.[0] || '';
  const lastInitial = user.last_name?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

type UserColumnsProps = {
  onRowAction?: (userId: string, action: string) => void;
};

export const createColumns = ({ onRowAction }: UserColumnsProps): ColumnDef<UserInfo>[] => [
  {
    accessorKey: "fullName",
    header: "User",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => (
      <div className="py-1 flex items-center gap-3">
          {row.original.image_url ? (
          <Image
            src={row.original.image_url}
            alt={row.original.full_name || "User"}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${stringToColor(row.original.full_name || "User")}`}>
            {getUserInitials(row.original)}
          </div>
        )}
        <div>
          <div className="font-medium">
            {row.original.full_name}
          </div>
          <div className="text-xs text-gray-500">Role: {row.original.role ? row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1) : 'N/A'}</div>
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
  {
    accessorKey: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <div className="flex">
          <Trash2 onClick={() => onRowAction?.(row.original.user_id, 'delete')} className="ml-2 h-4 w-4 text-red-600" />
        </div>
      );
    },
  },
];

// For backward compatibility, export a default columns array
export const columns = createColumns({});
