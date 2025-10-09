'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface YearSelectorProps {
  allYears: string[];
  selectedYears: string[];
  onChange: (years: string[]) => void;
}

const YearSelector = ({
  allYears,
  selectedYears,
  onChange,
}: YearSelectorProps) => {
  const [open, setOpen] = useState(false);
  
  const toggleYear = (year: string) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        onChange(selectedYears.filter((y) => y !== year));
      }
    } else {
      onChange([...selectedYears, year]);
    }
  };

  const selectAll = () => {
    onChange(allYears);
  };

  const deselectAll = () => {
    if (allYears.length > 0) {
      onChange([allYears[0]]);
    }
  };
  
  return (
    <div className="relative inline-block">
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select years"
      >
        <Calendar className="w-4 h-4" />
        <span>
          {selectedYears.length === allYears.length || selectedYears.length > allYears.length
            ? 'All Years' 
            : selectedYears.length === 1
            ? selectedYears[0]
            : `${selectedYears.length} Years`}
        </span>
      </button>
      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-semibold text-gray-700">Select Years</div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    All
                  </button>
                  <span className="text-xs text-gray-400">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allYears.map((year) => (
                  <label key={year} className="flex items-center cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => toggleYear(year)}
                      className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{year}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default YearSelector;

