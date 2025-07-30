package com.homeaccounting.components

import japgolly.scalajs.react._
import japgolly.scalajs.react.vdom.html_<^._

object AppHeader {
  
  case class Props(title: String, subtitle: String)
  
  val Component = ScalaComponent.builder[Props]("AppHeader")
    .render_P { props =>
      <.header(^.className := "app-header",
        <.h1(props.title),
        <.p(props.subtitle)
      )
    }
    .build
    
  def apply(title: String, subtitle: String) = Component(Props(title, subtitle))
}
