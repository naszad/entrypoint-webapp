import React, { useEffect, useRef } from 'react';
import { Check, LockKeyhole, Settings, X } from 'lucide-react';
import { Table } from '@tanstack/react-table';
import { ToolbarFilters } from './ToolbarFilters';
import { FilterValue } from './DataTable';

export interface ActionItem {
  id: string;
  title?: string;
  icon: React.ReactNode;
  label?: string;
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterValues: FilterValue[]
  actions: ActionItem[];
  onActionItemClicked?: (id: string) => void;
  onRemoveFilter: (key: string) => void;
  onClearAllFilters: () => void;
  showColumnSettings: boolean;
  setShowColumnSettings: (show: boolean) => void;
}

export function DataTableToolbar<TData>({
  table,
  filterValues,
  actions,
  onActionItemClicked,
  onRemoveFilter,
  onClearAllFilters,
  showColumnSettings,
  setShowColumnSettings
}: DataTableToolbarProps<TData>) {
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const columnSettingsRef = useRef<HTMLDivElement>(null);

  const handleSettingsClick = () => {
    setShowColumnSettings(!showColumnSettings);
  };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        
        const isSettingsButtonClick = settingsButtonRef.current?.contains(target);
  
        if (!isSettingsButtonClick) {
          if (columnSettingsRef.current && !columnSettingsRef.current.contains(target)) {
            setShowColumnSettings(false);
          }
        }
      };
  
      if (showColumnSettings) {
        document.addEventListener('mousedown', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [setShowColumnSettings, showColumnSettings]);

  return (
    <div className="h-10 min-h-10 border-b px-4 flex items-center justify-between bg-gray-50">
      <ToolbarFilters
        filterValues={filterValues}
        getColumnHeader={(columnId: string) =>
          table.getAllColumns().find((col) => col.id === columnId)?.columnDef.header as string
        }
        onRemoveFilter={onRemoveFilter}
        onClearAllFilters={onClearAllFilters}
      />
      <div className="flex items-center space-x-1 ml-4">
        {onActionItemClicked &&
          actions.map((action) => (
            <div key={action.id} className="border-r border-gray-200">
              <button
                onClick={() => onActionItemClicked(action.id)}
                className={`p-1.5 rounded hover:bg-gray-200 text-gray-600 focus:outline-none flex items-center gap-1 ${
                  action.label ? 'px-2' : 'rounded-full'
                }`}
                title={action.title}
              >
                {action.icon}
                {action.label && <span className="text-sm">{action.label}</span>}
              </button>
            </div>
          ))}
        <div className="relative">
          <button
            ref={settingsButtonRef}
            onClick={handleSettingsClick}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600 focus:outline-none"
            title="Column settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {showColumnSettings && (
            <div
              ref={columnSettingsRef}
              className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg py-1 z-50 w-56"
            >
              <div className="px-3 py-2 text-sm font-semibold border-b">Toggle Columns</div>
              {table.getAllColumns().map((column) => (
                <div
                  key={column.id}
                  className={`px-3 py-1.5 flex items-center ${
                    !column.getCanHide() ? '' : 'cursor-pointer hover:bg-gray-100'
                  }`}
                  onClick={() => column.getCanHide() && column.toggleVisibility(!column.getIsVisible())}
                >
                  <div className="mr-2">
                    {!column.getCanHide() ? (
                      <LockKeyhole className="h-4 w-4 text-gray-400" />
                    ) : column.getIsVisible() ? (
                      <Check className="h-4 w-4 text-blue-500" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <span className="text-sm">
                    {column.id.charAt(0).toUpperCase() + column.id.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
