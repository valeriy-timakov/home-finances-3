ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "2.13.12"

lazy val commonSettings = Seq(
  organization := "com.homeaccounting",
  scalacOptions ++= Seq(
    "-deprecation",
    "-encoding", "UTF-8",
    "-feature",
    "-unchecked",
    "-Xlint"
  )
)

lazy val root = (project in file("."))
  .aggregate(backend, frontend)
  .settings(
    name := "home-accounting-scala",
    publish / skip := true
  )

lazy val backend = (project in file("scala-backend"))
  .settings(
    commonSettings,
    name := "home-accounting-backend",
    libraryDependencies ++= Seq(
      "com.typesafe.akka" %% "akka-http" % "10.5.3",
      "com.typesafe.akka" %% "akka-stream" % "2.8.5",
      "com.typesafe.akka" %% "akka-actor-typed" % "2.8.5",
      "com.typesafe.akka" %% "akka-http-spray-json" % "10.5.3",
      "ch.qos.logback" % "logback-classic" % "1.4.11",
      "com.typesafe.scala-logging" %% "scala-logging" % "3.9.5",
      
      // Test dependencies
      "com.typesafe.akka" %% "akka-http-testkit" % "10.5.3" % Test,
      "com.typesafe.akka" %% "akka-actor-testkit-typed" % "2.8.5" % Test,
      "org.scalatest" %% "scalatest" % "3.2.17" % Test
    )
  )

lazy val frontend = (project in file("scala-frontend"))
  .enablePlugins(ScalaJSPlugin)
  .settings(
    commonSettings,
    name := "home-accounting-frontend",
    
    // ScalaJS settings
    scalaJSUseMainModuleInitializer := true,
    
    libraryDependencies ++= Seq(
      "org.scala-js" %%% "scalajs-dom" % "2.4.0",
      "com.github.japgolly.scalajs-react" %%% "core" % "2.1.1",
      "com.github.japgolly.scalajs-react" %%% "extra" % "2.1.1",
      
      // Test dependencies
      "org.scalatest" %%% "scalatest" % "3.2.17" % Test
    ),
    
    // Development server settings
    fastOptJS / crossTarget := baseDirectory.value / "target" / "dev",
    fullOptJS / crossTarget := baseDirectory.value / "target" / "prod",
    
    // Enhanced debugging support
    fastOptJS / scalaJSLinkerConfig ~= {
      _.withSourceMap(true)
       .withOptimizer(false)
       .withSourceMapURI(uri => Some(uri.toString))
    }
  )
