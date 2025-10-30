import { X } from "lucide-react";
import { FilterValue } from "./DataTable";

interface FilterPillProps {
  filter: FilterValue;
  label: string;
  value: string;
  condition: string;
  onRemove: (filter: FilterValue) => void;
}

export function FilterPill({ filter, label, value, condition, onRemove }: FilterPillProps) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-gray-500">{condition}</span>
      <span>{value}</span>
      <button
        onClick={() => onRemove(filter)}
        className="ml-1 p-0.5 hover:bg-gray-200 rounded-full"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
