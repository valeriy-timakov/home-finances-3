export class CategoryDto {
  id: number;
  name: string;
  superCategoryId?: number;
  children?: CategoryDto[];
}
