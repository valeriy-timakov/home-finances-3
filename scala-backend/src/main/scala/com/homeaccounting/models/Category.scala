package com.homeaccounting.models

import scalikejdbc._

/**
 * Model representing a Category in the database
 *
 * @param id The category ID
 * @param name The category name
 * @param agentId The ID of the agent that owns this category
 * @param superCategoryId The ID of the parent category (if any)
 */
case class Category(
  id: Int,
  name: String,
  agentId: Int,
  superCategoryId: Option[Int] = None
)

object Category extends SQLSyntaxSupport[Category] {
  override val tableName = "Category"
  
  def apply(c: SyntaxProvider[Category])(rs: WrappedResultSet): Category = apply(c.resultName)(rs)
  
  def apply(c: ResultName[Category])(rs: WrappedResultSet): Category = new Category(
    id = rs.int(c.id),
    name = rs.string(c.name),
    agentId = rs.int(c.agentId),
    superCategoryId = rs.intOpt(c.superCategoryId)
  )
}