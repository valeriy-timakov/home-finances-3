package com.homeaccounting

import com.homeaccounting.components.{AppHeader, FeatureCard}
import japgolly.scalajs.react._
import japgolly.scalajs.react.vdom.html_<^._
import org.scalajs.dom

object Main {
  
  // Main App component
  val App = ScalaComponent.builder[Unit]("App")
    .render(_ =>
      <.div(^.className := "app",
        AppHeader("Home Accounting - Scala Edition", "Welcome to the Scala-based home accounting application!"),
        <.main(^.className := "app-main",
          FeatureCard("Features", List(
            "Akka HTTP Backend",
            "ScalaJS Frontend", 
            "React Components",
            "Modern UI",
            "Type-safe Development"
          )),
          <.div(^.className := "card",
            <.h2("API Status"),
            <.p("Test the connection to the backend API:"),
            <.button(
              ^.onClick --> Callback {
                // Simple API call example
                dom.window.fetch("/api/health")
                  .toFuture
                  .foreach { response =>
                    println(s"API Health Check: ${response.status}")
                    if (response.ok) {
                      dom.window.alert("✅ Backend API is running!")
                    } else {
                      dom.window.alert("❌ Backend API is not responding")
                    }
                  }(scala.concurrent.ExecutionContext.global)
              },
              "Check API Health"
            )
          )
        )
      )
    )
    .build

  def main(args: Array[String]): Unit = {
    println("🚀 Scala.js Main.main() called - initializing application...")
    dom.console.log("🚀 Scala.js Main.main() called - initializing application...")
    
    val container = Option(dom.document.getElementById("root")).getOrElse {
      val div = dom.document.createElement("div")
      div.id = "root"
      dom.document.body.appendChild(div)
      div
    }

    App().renderIntoDOM(container)
    
    println("✅ Scala.js application initialized successfully")
    dom.console.log("✅ Scala.js application initialized successfully")
  }
}
