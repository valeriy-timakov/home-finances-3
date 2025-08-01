package com.homeaccounting.components

import japgolly.scalajs.react._
import japgolly.scalajs.react.vdom.html_<^._

object FeatureCard {
  
  case class Props(title: String, features: List[String])
  
  val Component = ScalaComponent.builder[Props]("FeatureCard")
    .render_P { props =>
      <.div(^.className := "card",
        <.h2(props.title),
        <.ul(
          props.features.toTagMod(feature => <.li(feature))
        )
      )
    }
    .build
    
  def apply(title: String, features: List[String]) = Component(Props(title, features))
}
