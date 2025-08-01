package com.homeaccounting.api

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import com.homeaccounting.dto.{CategoryDto, CategoryDtoJsonProtocol}
import com.homeaccounting.services.CategoryService
import com.typesafe.scalalogging.LazyLogging
import spray.json._

import scala.util.{Failure, Success}

class CategoriesRoutes extends LazyLogging {
  import CategoryDtoJsonProtocol._
  
  private val categoryService = new CategoryService()
  
  val routes: Route = pathPrefix("categories") {
    concat(
      pathEndOrSingleSlash {
        get {
          // Get all categories as a tree structure
          // In a real application, we would get the agentId from the authentication
          // For now, we'll use a hardcoded value
          val agentId = 1
          val categories = categoryService.findAllTree(agentId)
          complete(categories.toJson)
        } ~
        post {
          // Create a new category
          entity(as[CategoryDto]) { categoryDto =>
            val agentId = 1 // Hardcoded for now
            categoryService.create(categoryDto, agentId) match {
              case Success(category) =>
                complete(StatusCodes.Created, category.toString)
              case Failure(ex) =>
                logger.error("Failed to create category", ex)
                complete(StatusCodes.BadRequest, ex.getMessage)
            }
          }
        }
      },
      path("select-items") {
        get {
          // Get all categories as select items
          val agentId = 1 // Hardcoded for now
          val selectItems = categoryService.findSelectItems(agentId)
          complete(selectItems.toJson)
        }
      },
      path(IntNumber) { id =>
        put {
          // Update a category
          entity(as[CategoryDto]) { categoryDto =>
            val agentId = 1 // Hardcoded for now
            categoryService.update(id, categoryDto, agentId) match {
              case Success(category) =>
                complete(category.toString)
              case Failure(ex) =>
                logger.error(s"Failed to update category with ID $id", ex)
                complete(StatusCodes.BadRequest, ex.getMessage)
            }
          }
        } ~
        delete {
          // Remove a category
          val agentId = 1 // Hardcoded for now
          categoryService.remove(id, agentId) match {
            case Success(true) =>
              complete(StatusCodes.NoContent)
            case Success(false) =>
              complete(StatusCodes.NotFound, s"Category with ID $id not found")
            case Failure(ex) =>
              logger.error(s"Failed to remove category with ID $id", ex)
              complete(StatusCodes.BadRequest, ex.getMessage)
          }
        }
      }
    )
  }
}
