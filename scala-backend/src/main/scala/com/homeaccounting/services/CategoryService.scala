package com.homeaccounting.services

import com.homeaccounting.models.Category
import com.homeaccounting.dto.{CategoryDto, CategoryTreeDto, CategorySelectItemDto}
import com.typesafe.scalalogging.LazyLogging
import scalikejdbc._
import scalikejdbc.SQLSyntax.createUnsafely

import scala.util.{Try, Success, Failure}

/**
 * Service for working with categories
 */
class CategoryService extends LazyLogging {
  // Alias for the Category syntax provider
  private val c = Category.syntax("c")
  
  /**
   * Find all categories for the given agent and return them as a tree structure
   *
   * @param agentId The ID of the agent
   * @return A sequence of CategoryTreeDto representing the category tree
   */
  def findAllTree(agentId: Int): Seq[CategoryTreeDto] = {
    DB.readOnly { implicit session =>
      // Get all categories for the agent
      val categories = withSQL {
        select.from(Category as c)
          .where.eq(c.agentId, agentId)
          .orderBy(c.id.asc)
      }.map(Category(c)).list.apply()
      
      // Build a map of categories by ID
      val categoryMap = categories.map(cat => cat.id -> cat).toMap
      
      // Build a map of category trees with their children
      val treeMap = categories.map { cat =>
        cat.id -> CategoryTreeDto(
          id = cat.id,
          name = cat.name,
          superCategoryId = cat.superCategoryId,
          children = Seq.empty
        )
      }.toMap
      
      // Build the tree structure
      val tree = treeMap.values.filter(_.superCategoryId.isEmpty).toSeq
      
      // Add children to their parents
      categories.foreach { cat =>
        cat.superCategoryId.foreach { parentId =>
          treeMap.get(parentId).foreach { parent =>
            val updatedParent = parent.copy(
              children = parent.children :+ treeMap(cat.id)
            )
            treeMap.updated(parentId, updatedParent)
          }
        }
      }
      
      // Return the root categories (those without a parent)
      categories.filter(_.superCategoryId.isEmpty).map { cat =>
        buildCategoryTree(cat, categories)
      }
    }
  }
  
  /**
   * Build a category tree for the given category and its children
   *
   * @param category The root category
   * @param allCategories All categories
   * @return A CategoryTreeDto representing the category tree
   */
  private def buildCategoryTree(category: Category, allCategories: Seq[Category]): CategoryTreeDto = {
    val children = allCategories.filter(_.superCategoryId.contains(category.id))
    CategoryTreeDto(
      id = category.id,
      name = category.name,
      superCategoryId = category.superCategoryId,
      children = children.map(child => buildCategoryTree(child, allCategories))
    )
  }
  
  /**
   * Find all categories for the given agent and return them as select items
   *
   * @param agentId The ID of the agent
   * @return A sequence of CategorySelectItemDto
   */
  def findSelectItems(agentId: Int): Seq[CategorySelectItemDto] = {
    DB.readOnly { implicit session =>
      // Get all categories for the agent
      val categories = withSQL {
        select.from(Category as c)
          .where.eq(c.agentId, agentId)
          .orderBy(c.name.asc)
      }.map(Category(c)).list.apply()
      
      // Build a map of categories by ID
      val categoryMap = categories.map(cat => cat.id -> cat).toMap
      
      // Function to get the full path of a category
      def getCategoryPath(categoryId: Int): String = {
        categoryMap.get(categoryId) match {
          case Some(category) =>
            category.superCategoryId match {
              case Some(parentId) => s"${getCategoryPath(parentId)} > ${category.name}"
              case None => category.name
            }
          case None => ""
        }
      }
      
      // Return categories as select items
      categories.map { category =>
        CategorySelectItemDto(
          id = category.id,
          label = getCategoryPath(category.id)
        )
      }
    }
  }
  
  /**
   * Create a new category
   *
   * @param categoryDto The category data
   * @param agentId The ID of the agent
   * @return The created category
   */
  def create(categoryDto: CategoryDto, agentId: Int): Try[Category] = {
    // Check if the super category exists and belongs to the agent
    categoryDto.superCategoryId.foreach { superCategoryId =>
      val superCategory = findById(superCategoryId)
      if (superCategory.isEmpty) {
        return Failure(new IllegalArgumentException(s"Super category with ID $superCategoryId not found"))
      }
      if (superCategory.get.agentId != agentId) {
        return Failure(new IllegalArgumentException("You do not have access to this super category"))
      }
    }
    
    // Create the category
    Try {
      DB.localTx { implicit session =>
        val id = withSQL {
          insert.into(Category).namedValues(
            createUnsafely("name") -> categoryDto.name,
            createUnsafely("agentId") -> agentId,
            createUnsafely("superCategoryId") -> AsIsParameterBinder(categoryDto.superCategoryId.orNull)
          )
        }.updateAndReturnGeneratedKey.apply()
        
        Category(
          id = id.toInt,
          name = categoryDto.name,
          agentId = agentId,
          superCategoryId = categoryDto.superCategoryId
        )
      }
    }
  }
  
  /**
   * Update a category
   *
   * @param id The ID of the category to update
   * @param categoryDto The updated category data
   * @param agentId The ID of the agent
   * @return The updated category
   */
  def update(id: Int, categoryDto: CategoryDto, agentId: Int): Try[Category] = {
    // Check if the category exists and belongs to the agent
    val existingCategory = findById(id)
    if (existingCategory.isEmpty) {
      return Failure(new IllegalArgumentException(s"Category with ID $id not found"))
    }
    if (existingCategory.get.agentId != agentId) {
      return Failure(new IllegalArgumentException("You do not have access to this category"))
    }
    
    // Check if the super category exists and belongs to the agent
    categoryDto.superCategoryId.foreach { superCategoryId =>
      // Check for circular dependency
      if (superCategoryId == id) {
        return Failure(new IllegalArgumentException("Category cannot be its own parent"))
      }
      
      val superCategory = findById(superCategoryId)
      if (superCategory.isEmpty) {
        return Failure(new IllegalArgumentException(s"Super category with ID $superCategoryId not found"))
      }
      if (superCategory.get.agentId != agentId) {
        return Failure(new IllegalArgumentException("You do not have access to this super category"))
      }
      
      // Check for circular dependency through nested categories
      if (isChildOf(superCategoryId, id)) {
        return Failure(new IllegalArgumentException("Cannot create cyclic dependency in category hierarchy"))
      }
    }
    
    // Update the category
    Try {
      DB.localTx { implicit session =>
        withSQL {
          QueryDSL.update(Category).set(
            createUnsafely("name") -> categoryDto.name,
            createUnsafely("superCategoryId") -> AsIsParameterBinder(categoryDto.superCategoryId.orNull)
          ).where.eq(createUnsafely("id"), id)
        }.update.apply()
        
        Category(
          id = id,
          name = categoryDto.name,
          agentId = agentId,
          superCategoryId = categoryDto.superCategoryId
        )
      }
    }
  }
  
  /**
   * Remove a category
   *
   * @param id The ID of the category to remove
   * @param agentId The ID of the agent
   * @return True if the category was removed, false otherwise
   */
  def remove(id: Int, agentId: Int): Try[Boolean] = {
    // Check if the category exists and belongs to the agent
    val existingCategory = findById(id)
    if (existingCategory.isEmpty) {
      return Failure(new IllegalArgumentException(s"Category with ID $id not found"))
    }
    if (existingCategory.get.agentId != agentId) {
      return Failure(new IllegalArgumentException("You do not have access to this category"))
    }
    
    // Check if there are products using this category
    // This would require a ProductOrService model, which we don't have yet
    // For now, we'll just check if there are subcategories
    
    // Delete the category and its subcategories
    Try {
      DB.localTx { implicit session =>
        // Get all subcategories
        val subcategories = findSubcategories(id)
        
        // Delete all subcategories
        subcategories.foreach { subcategory =>
          withSQL {
            delete.from(Category).where.eq(createUnsafely("id"), subcategory.id)
          }.update.apply()
        }
        
        // Delete the category
        val deleted = withSQL {
          delete.from(Category).where.eq(createUnsafely("id"), id)
        }.update.apply()
        
        deleted > 0
      }
    }
  }
  
  /**
   * Find a category by ID
   *
   * @param id The ID of the category
   * @return The category, if found
   */
  def findById(id: Int): Option[Category] = {
    DB.readOnly { implicit session =>
      withSQL {
        select.from(Category as c)
          .where.eq(c.id, id)
      }.map(Category(c)).single.apply()
    }
  }
  
  /**
   * Find all subcategories of a category
   *
   * @param categoryId The ID of the parent category
   * @return A sequence of subcategories
   */
  def findSubcategories(categoryId: Int): Seq[Category] = {
    DB.readOnly { implicit session =>
      withSQL {
        select.from(Category as c)
          .where.eq(c.superCategoryId, categoryId)
      }.map(Category(c)).list.apply()
    }
  }
  
  /**
   * Check if a category is a child of another category
   *
   * @param potentialChildId The ID of the potential child category
   * @param potentialParentId The ID of the potential parent category
   * @return True if the category is a child of the other category, false otherwise
   */
  def isChildOf(potentialChildId: Int, potentialParentId: Int): Boolean = {
    val potentialChild = findById(potentialChildId)
    
    potentialChild match {
      case Some(category) =>
        category.superCategoryId match {
          case Some(superCategoryId) =>
            if (superCategoryId == potentialParentId) {
              true
            } else {
              isChildOf(superCategoryId, potentialParentId)
            }
          case None => false
        }
      case None => false
    }
  }
}