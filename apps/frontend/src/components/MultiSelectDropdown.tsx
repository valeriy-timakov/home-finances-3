import React, { useState, useRef, useEffect } from 'react';

type Option = {
  value: string;
  label: string;
};

type MultiSelectDropdownProps = {
  id: string;
  name: string;
  options: Option[];
  selectedValues: string[];
  onChange: (name: string, selectedValues: string[]) => void;
  label: string;
  className?: string;
};

export default function MultiSelectDropdown({
  id,
  name,
  options,
  selectedValues,
  onChange,
  label,
  className = '',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    let newSelectedValues: string[];
    
    if (isChecked) {
      newSelectedValues = [...selectedValues, value];
    } else {
      newSelectedValues = selectedValues.filter(val => val !== value);
    }
    
    onChange(name, newSelectedValues);
  };

  const displayText = selectedValues.length > 0
    ? options
        .filter(option => selectedValues.includes(option.value))
        .map(option => option.label)
        .join(', ')
    : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div
        className="mt-1 cursor-pointer flex justify-between items-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        onClick={handleToggle}
      >
        <div className="truncate">
          {displayText || <span className="text-gray-400">Select options...</span>}
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {options.map((option) => (
              <div key={option.value} className="flex items-center px-3 py-2 hover:bg-gray-100">
                <input
                  type="checkbox"
                  id={`${id}-${option.value}`}
                  value={option.value}
                  checked={selectedValues.includes(option.value)}
                  onChange={handleOptionChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`${id}-${option.value}`}
                  className="ml-2 block text-sm text-gray-900 cursor-pointer w-full"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
