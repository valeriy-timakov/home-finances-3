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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleCheckboxChange = (id: number) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(newSelectedIds);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          {items.map(item => (
            <label key={item.id} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => handleCheckboxChange(item.id)}
              />
              <span className={styles.checkboxLabel}>{item.label}</span>
            </label>
          ))}
          {items.length === 0 && (
            <div className={styles.noItems}>No items available</div>
          )}
        </div>
      )}
    </div>
  );
};
