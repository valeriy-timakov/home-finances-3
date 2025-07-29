/**
 * Data Transfer Object for Category
 * Contains category information including name, id, and path to the category
 */
export interface Category {
  /** Unique identifier for the category */
  id: number;
  
  /** Name of the category */
  name: string;
  
  /** 
   * Path to the category - array of all parent categories
   * Starting from the root category and ending with the direct parent
   */
  path: Category[];
}
