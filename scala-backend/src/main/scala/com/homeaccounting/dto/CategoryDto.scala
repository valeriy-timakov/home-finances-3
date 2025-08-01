package com.homeaccounting.dto

import com.homeaccounting.models.Category
import spray.json.{DefaultJsonProtocol, RootJsonFormat}

/**
 * DTO for creating or updating a category
 *
 * @param id The category ID (optional for creation)
 * @param name The category name
 * @param superCategoryId The ID of the parent category (if any)
 */
case class CategoryDto(
  id: Option[Int] = None,
  name: String,
  superCategoryId: Option[Int] = None
)

/**
 * DTO for returning a category in a tree structure
 *
 * @param id The category ID
 * @param name The category name
 * @param superCategoryId The ID of the parent category (if any)
 * @param children The child categories
 */
case class CategoryTreeDto(
  id: Int,
  name: String,
  superCategoryId: Option[Int] = None,
  children: Seq[CategoryTreeDto] = Seq.empty
)

/**
 * DTO for returning a category as a select item
 *
 * @param id The category ID
 * @param label The category label (full path)
 */
case class CategorySelectItemDto(
  id: Int,
  label: String
)

/**
 * JSON protocol for CategoryDto
 */
object CategoryDtoJsonProtocol extends DefaultJsonProtocol {
  implicit val categoryDtoFormat: RootJsonFormat[CategoryDto] = jsonFormat3(CategoryDto.apply)
  implicit val categoryTreeDtoFormat: RootJsonFormat[CategoryTreeDto] = jsonFormat4(CategoryTreeDto.apply)
  implicit val categorySelectItemDtoFormat: RootJsonFormat[CategorySelectItemDto] = jsonFormat2(CategorySelectItemDto.apply)
}

/**
 * Conversion methods for Category and DTOs
 */
object CategoryDtoConverter {
  def fromCategory(category: Category): CategoryDto = {
    CategoryDto(
      id = Some(category.id),
      name = category.name,
      superCategoryId = category.superCategoryId
    )
  }
  
  def toCategoryTreeDto(category: Category, children: Seq[CategoryTreeDto] = Seq.empty): CategoryTreeDto = {
    CategoryTreeDto(
      id = category.id,
      name = category.name,
      superCategoryId = category.superCategoryId,
      children = children
    )
  }
  
  def toCategorySelectItemDto(category: Category, label: String): CategorySelectItemDto = {
    CategorySelectItemDto(
      id = category.id,
      label = label
    )
  }
}