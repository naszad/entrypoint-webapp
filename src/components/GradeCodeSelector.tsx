'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';

interface GradeCodeSelectorProps {
  allCodes: string[];
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
}

const GradeCodeSelector = ({
  allCodes,
  selectedCodes,
  onChange,
}: GradeCodeSelectorProps) => {
  const [open, setOpen] = useState(false);
  
  const toggleCode = (code: string) => {
    if (selectedCodes.includes(code)) {
      onChange(selectedCodes.filter((c) => c !== code));
    } else {
      onChange([...selectedCodes, code]);
    }
  };
  
  return (
    <div className="relative inline-block">
      <button
        className="ml-2 text-gray-500 hover:text-gray-700"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select grade codes"
      >
        <Settings className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-10 right-0 mt-2 w-40 bg-white border rounded shadow-lg p-2">
          <div className="text-xs font-bold mb-2">Select Grade Codes</div>
          {allCodes.map((code) => (
            <label key={code} className="flex items-center mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCodes.includes(code)}
                onChange={() => toggleCode(code)}
                className="mr-2"
              />
              {code}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradeCodeSelector; 