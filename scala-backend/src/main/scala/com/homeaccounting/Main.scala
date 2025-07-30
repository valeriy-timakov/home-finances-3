package com.homeaccounting

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.typesafe.scalalogging.LazyLogging

import java.io.File
import scala.concurrent.{Await, ExecutionContextExecutor, Future}
import scala.io.StdIn
import scala.util.{Failure, Success}

object Main extends App with LazyLogging {
  
  implicit val system: ActorSystem[Nothing] = ActorSystem(Behaviors.empty, "home-accounting-system")
  implicit val executionContext: ExecutionContextExecutor = system.executionContext

  val routes: Route = 
    pathPrefix("api") {
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
        }
      )
    } ~
    pathPrefix("static") {
      // Serve compiled ScalaJS files
      path("scala-frontend-fastopt" / "main.js") {
        val jsFile = new File("scala-frontend/target/scala-2.13/home-accounting-frontend-fastopt/main.js")
        if (jsFile.exists()) {
          getFromFile(jsFile)
        } else {
          complete(StatusCodes.NotFound -> "JavaScript file not found. Run 'sbt frontend/fastOptJS' first.")
        }
      } ~
      path("scala-frontend-fastopt" / "main.js.map") {
        val mapFile = new File("scala-frontend/target/scala-2.13/home-accounting-frontend-fastopt/main.js.map")
        if (mapFile.exists()) {
          getFromFile(mapFile)
        } else {
          complete(StatusCodes.NotFound -> "Source map file not found.")
        }
      } ~
      getFromResourceDirectory("static")
    } ~
    pathSingleSlash {
      getFromResource("index.html")
    } ~
    // Fallback to serve index.html for SPA routing
    getFromResource("index.html")

  val bindingFuture = Http().newServerAt("localhost", 8080).bind(routes)

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



  def terminate(): Future[Unit] =
    bindingFuture.flatMap(_.unbind())
        .map(_ => system.terminate())


  println(s"Server now online. Please navigate to http://localhost:8080/api/hello\nPress RETURN to stop...")
  
  // Keep the server running
  scala.concurrent.Await.result(system.whenTerminated, scala.concurrent.duration.Duration.Inf)
}
