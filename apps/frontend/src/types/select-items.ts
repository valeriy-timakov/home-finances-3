// Universal select item type for all dropdown selects
export interface SelectItem {
  id: number;
  label: string;
}

// Legacy types for backward compatibility
export interface ProductSelectItem extends SelectItem {}
export interface CategorySelectItem extends SelectItem {}
