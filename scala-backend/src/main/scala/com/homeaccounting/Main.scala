package com.homeaccounting

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.homeaccounting.api.CategoriesRoutes
import com.typesafe.scalalogging.LazyLogging
import scalikejdbc._
import scalikejdbc.config._

import java.io.File
import scala.concurrent.{Await, ExecutionContextExecutor, Future}
import scala.io.StdIn
import scala.util.{Failure, Success}

object Main extends App with LazyLogging {
  
  // Initialize ScalikeJDBC with configuration from application.conf
  DBs.setupAll()
  
  // Log database connection info
  logger.info("Database connection initialized")
  
  implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "home-accounting-system")
  implicit val executionContext: ExecutionContextExecutor = system.executionContext

  private val apiRoutes: Route = pathPrefix("api") {
    concat(
      path("health") {
        get {
          complete("OK")
        }
      },
      path("hello") {
        get {
          complete("Hello from Akka HTTP!")
        }
      },
      new CategoriesRoutes().routes
    )
  }

  private val rootRoute: Route = pathSingleSlash {
    getFromFile("scala-frontend/target/scala-3.4.2/esbuild/main/out/index.html")
  }

  private val frontendRoutes: Route = get {
    getFromDirectory("scala-frontend/target/scala-3.4.2/esbuild/main/out")
  }

//  val frontendRoutes: Route = {
//    pathSingleSlash {
//      getFromResource("index.html")
//    } ~ get {
//      getFromResource("index.html")
//    }
//  }

  private val routes: Route = apiRoutes ~ rootRoute ~ frontendRoutes

  private val bindingFuture = Http().newServerAt("localhost", 8080).bind(routes)

  bindingFuture.onComplete {
    case Success(binding) =>
      val address = binding.localAddress
      logger.info(s"Server online at http://${address.getHostString}:${address.getPort}/")
      logger.info("Make sure to run 'sbt frontend/fastOptJS' to compile the frontend")
    case Failure(ex) =>
      logger.error("Failed to bind HTTP endpoint, terminating system", ex)
      system.terminate()
          //System.exit(0)
  }



  def terminate(): Future[Unit] = {
    // Close database connections
    DBs.closeAll()
    logger.info("Database connections closed")
    
    // Unbind and terminate the server
    bindingFuture.flatMap(_.unbind())
      .map(_ => system.terminate())
  }

  // Add shutdown hook to close database connections
  sys.addShutdownHook {
    logger.info("Shutting down...")
    DBs.closeAll()
    logger.info("Database connections closed")
  }

  println(s"Server now online. Please navigate to http://localhost:8080/api/hello\nPress RETURN to stop...")
  
  // Keep the server running
  scala.concurrent.Await.result(system.whenTerminated, scala.concurrent.duration.Duration.Inf)
}
