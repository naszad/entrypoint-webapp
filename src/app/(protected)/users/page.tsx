'use client';
import { createColumns, defaultVisibility as initialVisibility } from "@/components/UserColumns"
import { DataTable, FilterValue } from "@/components/DataTable/DataTable"
import { ActionItem } from "@/components/DataTable/DataTableToolbar";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Role, UserInfo } from "@/types/UserInfo";
import { SaveUserDialog } from "@/components/SaveUserDialog";
import { cn } from "@/utils/utils";
import { useChatAssistantOpen } from "@/context/ChatAssistantOpenContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const UsersPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'destructive', message: string } | null>(null);
  const { isChatAssistantOpen } = useChatAssistantOpen();

  const fetchUsers = async (
    filters: FilterValue[], 
    sortField: string, 
    sortDirection: 'asc' | 'desc',
  ) => {
    try {      
      setIsLoading(true);
      
      // Build query parameters more carefully
      const queryParams = new URLSearchParams();
      
      // Only add filters if there are any
      if (filters.length > 0) {
        const filtersParam = filters.map(f => `${f.key}:${f.condition}:${f.value}`).join(',');
        queryParams.set('filters', filtersParam);
      }
      
      // Add sort if provided
      if (sortField) {
        queryParams.set('sort', `${sortField}:${sortDirection}`);
      }
      
      const url = `/api/users?${queryParams.toString()}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setAlertMessage({ 
          type: 'destructive', 
          message: data.error || 'Failed to fetch users'
        });
        return;
      }

      setUsers(data);
    } catch (err) {
      setAlertMessage({ 
        type: 'destructive', 
        message: `Failed to fetch users ${err instanceof Error ? err.message : ''}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Unified handler for DataTable param changes
  const handleParamsChange = async (params: { filters: FilterValue[], sorting: { id: string; desc: boolean }[], pageNumber: number, pageSize: number }) => {
    const filters = params.filters || [];
    const sorting = params.sorting || [];
    const sortId = sorting[0]?.id || '';
    const sortDirection = sorting[0]?.desc ? 'desc' : 'asc';
    await fetchUsers(filters, sortId, sortDirection);
  };

  const handleSaveUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
  }) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add user');
    }

    // Refresh the users list to get the updated data
    await fetchUsers([], '', 'asc');

    // Show success message on the main page
    setAlertMessage({
      type: 'success',
      message: 'User added successfully'
    });
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      try {
        setIsDeleteDialogOpen(false);
        setIsLoading(true);
        
        const response = await fetch(`/api/users?userId=${selectedUser}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          setAlertMessage({
            type: 'destructive',
            message: result.error || 'Failed to delete user'
          });
          return;
        }

        // Remove the user from the local state
        setUsers(users.filter(user => user.user_id !== selectedUser));

        setAlertMessage({
          type: 'success',
          message: 'User deleted successfully'
        });
      } catch (err) {
        setAlertMessage({
          type: 'destructive',
          message: err instanceof Error ? err.message : 'Failed to delete user'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRowAction = async (userId: string, action: string) => {
    if (action === 'delete') {
      setSelectedUser(userId);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user || user.role === newRole) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        setAlertMessage({
          type: 'destructive',
          message: result.error || 'Failed to update user role',
        });
        return;
      }

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );

      setAlertMessage({
        type: 'success',
        message: 'User role updated successfully',
      });
    } catch (err) {
      setAlertMessage({
        type: 'destructive',
        message: err instanceof Error ? err.message : 'Failed to update user role',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const columns = createColumns({ onRowAction: handleRowAction, onRoleChange: handleRoleChange });

  const action: ActionItem[] = [];

  return (

    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-700">Users</h3>
        <div className={cn("flex gap-2 justify-end", isChatAssistantOpen ? "" : "mr-35")}>
          <SaveUserDialog 
            onSave={handleSaveUser} 
          />
        </div>
      </div>
      
      {alertMessage && (
        <Alert  className="mb-4"
          autoClose={true}
          variant={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}
      <div className="flex-1 w-full h-50">
        <DataTable 
          enablePagination={false}
          total={users.length}
          columns={columns} 
          data={users} 
          className="w-full"
          actions={action}
          defaultVisibility={initialVisibility}
          onParamsChange={handleParamsChange}
          isLoading={isLoading}
        />
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Do you wish to remove user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              No
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UsersPage