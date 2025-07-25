import React, { useState, useRef, useEffect } from 'react';
import { SelectItem } from '@/types/select-items';
import styles from './UniversalSelectDropdown.module.css';

interface UniversalSelectDropdownProps {
  items: SelectItem[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const UniversalSelectDropdown: React.FC<UniversalSelectDropdownProps> = ({
  items,
  selectedIds,
  onChange,
  placeholder = 'Select items...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      // Reset search term when closing dropdown
      if (isOpen) {
        setSearchTerm('');
      }
    }
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleCheckboxChange = (id: number) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(newSelectedIds);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectAll = () => {
    // Select all items that match the current filter
    const filteredItemIds = filteredItems.map(item => item.id);
    onChange(filteredItemIds);
  };

  const handleClearAll = () => {
    // Clear all selected items
    onChange([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabels = items
    .filter(item => selectedIds.includes(item.id))
    .map(item => item.label);

  const displayText = selectedLabels.length > 0
    ? selectedLabels.join(', ')
    : placeholder;

  return (
    <div className={`${styles.dropdown} ${className}`} ref={dropdownRef}>
      <div 
        className={`${styles.dropdownToggle} ${disabled ? styles.disabled : ''}`} 
        onClick={toggleDropdown}
      >
        <div className={styles.selectedText} title={displayText}>
          {displayText}
        </div>
        <div className={styles.arrow}>▼</div>
      </div>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {/* Search input */}
          <div className={styles.searchContainer}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Select All / Clear All buttons */}
          <div className={styles.actionButtons}>
            <button 
              className={styles.actionButton} 
              onClick={handleSelectAll}
              disabled={filteredItems.length === 0}
            >
              Select All
            </button>
            <button 
              className={styles.actionButton} 
              onClick={handleClearAll}
              disabled={selectedIds.length === 0}
            >
              Clear All
            </button>
          </div>
          
          {/* Divider */}
          <div className={styles.divider}></div>
          
          {/* Checkbox items */}
          <div className={styles.checkboxContainer}>
            {filteredItems.map(item => (
              <label key={item.id} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => handleCheckboxChange(item.id)}
                />
                <span className={styles.checkboxLabel}>{item.label}</span>
              </label>
            ))}
            {filteredItems.length === 0 && (
              <div className={styles.noItems}>
                {searchTerm ? 'No matching items' : 'No items available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
