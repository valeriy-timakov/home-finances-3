ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "3.4.2"

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
      
      // ScalikeJDBC dependencies
      "org.scalikejdbc" %% "scalikejdbc" % "4.2.1",
      "org.scalikejdbc" %% "scalikejdbc-config" % "4.2.1",
      "org.postgresql" % "postgresql" % "42.7.2",
      "com.h2database" % "h2" % "2.2.224" % Test,
      
      // Test dependencies
      "com.typesafe.akka" %% "akka-http-testkit" % "10.5.3" % Test,
      "com.typesafe.akka" %% "akka-actor-testkit-typed" % "2.8.5" % Test,
      "org.scalatest" %% "scalatest" % "3.2.17" % Test
    )
  )

lazy val frontend = (project in file("scala-frontend"))
  .enablePlugins(ScalaJSEsbuildWebPlugin)
  .settings(
    commonSettings,
    name := "home-accounting-frontend",


    // ScalaJS settings
    scalaJSUseMainModuleInitializer := true,
    // esbuild dev server port
    esbuildServe / serverPort := 3000,

      // Removed invalid modification to esbuildBundleScript which produced a syntax error during bundling
      // If you want to change the log level, pass the flag through esbuildBundleArgs instead, e.g.:
      // Compile / fastLinkJS / esbuildBundleArgs += "--log-level=debug",
      Compile / unmanagedResourceDirectories := Seq(baseDirectory.value / "esbuild"),

          libraryDependencies ++= Seq(
      "org.scala-js" %%% "scalajs-dom" % "2.8.0",
      "com.github.japgolly.scalajs-react" %%% "core" % "2.1.2",
      "com.github.japgolly.scalajs-react" %%% "extra" % "2.1.2",

      // Test dependencies
      "org.scalatest" %%% "scalatest" % "3.2.17" % Test
    )
  )


/** модуль під Vite */
lazy val webVite = (project in file("web-vite"))
    .enablePlugins(ScalaJSPlugin)             // базовий Scala.js
    .settings(
        scalaJSUseMainModuleInitializer := true,
        // ES-модуль обов’язковий для vite-plugin-scalajs
        scalaJSLinkerConfig ~= { _.withModuleKind(ModuleKind.ESModule) },

        libraryDependencies ++= Seq(
            "org.scala-js" %%% "scalajs-dom" % "2.8.0",
            "com.github.japgolly.scalajs-react" %%% "core" % "2.1.2",
            "com.github.japgolly.scalajs-react" %%% "extra" % "2.1.2",

            // Test dependencies
            "org.scalatest" %%% "scalatest" % "3.2.17" % Test
        )
    )