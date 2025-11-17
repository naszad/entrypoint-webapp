"use client";

import { Role, UserInfo } from "@/types/UserInfo";
import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import Image from "next/image";
import { stringToColor } from "@/utils/utils";
import { Trash2 } from "lucide-react";
import { ChangeEvent } from "react";

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
  onRoleChange?: (userId: string, newRole: Role) => void;
};

export const createColumns = ({ onRowAction, onRoleChange }: UserColumnsProps): ColumnDef<UserInfo>[] => [
  {
    accessorKey: "full_name",
    header: "User",
    enableHiding: false,
    meta: {
      enableFiltering: true,
      filterType: "text",
    },
    cell: ({ row }) => {
      const currentRole = row.original.role ?? "user";

      const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const newRole = event.target.value as Role;
        if (newRole !== currentRole) {
          onRoleChange?.(row.original.user_id, newRole);
        }
      };

      return (
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
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${stringToColor(
                row.original.full_name || "User"
              )}`}
            >
              {getUserInitials(row.original)}
            </div>
          )}
          <div>
            <div className="font-medium">{row.original.full_name}</div>
            <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
              <span>Role:</span>
              <select
                className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                value={currentRole}
                onChange={handleRoleChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      );
    },
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
