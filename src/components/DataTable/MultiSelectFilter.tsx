import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface MultiSelectFilterProps {
  columnId: string;
  headerText: string;
  filterConditions: Record<string, string>;
  setFilterConditions: (value: Record<string, string>) => void;
  multiSelectRemoteSource?: (columnId: string) => Promise<{ value: string; label: string }[]>;
}

export function MultiSelectFilter({
  columnId,
  headerText,
  filterConditions,
  setFilterConditions,
  multiSelectRemoteSource,
}: MultiSelectFilterProps) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse selected values from filter conditions on mount and when filter conditions change
  useEffect(() => {
    const currentValue = filterConditions[columnId];
    if (currentValue) {
      // Split by pipe character to get individual values
      const values = currentValue.split('|').filter(v => v.trim() !== '');
      setSelectedValues(values);
    } else {
      setSelectedValues([]);
    }
  }, [filterConditions, columnId]);

  // Load options when component mounts
  useEffect(() => {
    if (multiSelectRemoteSource && options.length === 0) {
      setIsLoading(true);
      multiSelectRemoteSource(columnId)
        .then((data) => {
          setOptions(data);
        })
        .catch((error) => {
          console.error('Error loading multi-select options:', error);
          setOptions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [multiSelectRemoteSource, columnId, options.length]);

  const handleToggleOption = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newSelectedValues);
    
    // Update filter conditions - use pipe separator for multiple values
    const filterValue = newSelectedValues.length > 0 ? newSelectedValues.join('|') : '';
    setFilterConditions({
      ...filterConditions,
      [columnId]: filterValue
    });
  };

  const handleSelectAll = () => {
    const allValues = options.map(option => option.value);
    setSelectedValues(allValues);
    setFilterConditions({
      ...filterConditions,
      [columnId]: allValues.join('|')
    });
  };

  const handleClearAll = () => {
    setSelectedValues([]);
    setFilterConditions({
      ...filterConditions,
      [columnId]: ''
    });
  };

  return (
    <div className="space-y-2">
      {/* <div className="text-xs font-medium text-gray-500 px-1">Select {headerText}</div> */}
      
      {/* Scrollable list box with max height 200px */}
      <div className="mb-2border bg-white" style={{ maxHeight: '200px' }}>
        {isLoading ? (
          <div className="p-2 text-sm text-gray-500">Loading...</div>
        ) : (
          <>
            {options.length > 0 && (
              <div className="p-2 border-b bg-gray-50 flex gap-2 sticky top-0">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={handleSelectAll}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:text-gray-800"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              </div>
            )}
            
            <div className="overflow-y-auto" style={{ maxHeight: options.length > 0 ? '170px' : '200px' }}>
              {options.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No {headerText} available</div>
              ) : (
                options.map((option) => (
                  <div
                    key={option.value}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      selectedValues.includes(option.value) 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-gray-300'
                    }`}>
                      {selectedValues.includes(option.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


