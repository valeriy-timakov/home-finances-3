package com.homeaccounting.api

import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

class CategoriesRoutes {
  val routes: Route = pathPrefix("categories") {
    concat(
      pathEndOrSingleSlash {
        get {
          complete("categories list") // Placeholder
        }
      }
    )
  }
}
