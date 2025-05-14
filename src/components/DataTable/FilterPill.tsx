import { X } from "lucide-react";

interface FilterPillProps {
  columnId: string;
  label: string;
  value: string;
  condition: string;
  onRemove: (columnId: string) => void;
}

export function FilterPill({ columnId, label, value, condition, onRemove }: FilterPillProps) {
  return (
    <div
      key={columnId}
      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
    >
      <span className="font-medium">{label}</span>
      <span className="text-gray-500">{condition}</span>
      <span>{value}</span>
      <button
        onClick={() => onRemove(columnId)}
        className="ml-1 p-0.5 hover:bg-gray-200 rounded-full"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
