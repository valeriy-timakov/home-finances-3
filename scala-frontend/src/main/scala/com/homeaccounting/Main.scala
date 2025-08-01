package com.homeaccounting

import japgolly.scalajs.react._
import japgolly.scalajs.react.vdom.html_<^._
import scala.language.implicitConversions
import japgolly.scalajs.react.extra.router._
import org.scalajs.dom

object Main {

  // ------------- ROUTE DEFINITIONS -------------------------------------------------
  sealed trait AppPage
  case object AccountsPage extends AppPage
  case object CategoriesPage extends AppPage
  case object ProductsPage extends AppPage
  case object TransactionsPage extends AppPage
  case object TransactionsDetailsPage extends AppPage

  // ------------- PAGE COMPONENTS ---------------------------------------------------
  private val AccountsComponent             = ScalaComponent.static("Accounts")(<.div(<.h1("Рахунки")))
  private val CategoriesComponent           = ScalaComponent.static("Categories")(<.div(<.h1("Категорії")))
  private val ProductsComponent             = ScalaComponent.static("Products")(<.div(<.h1("Продукти")))
  private val TransactionsComponent         = ScalaComponent.static("Transactions")(<.div(<.h1("Транзакції")))
  private val TransactionsDetailsComponent  = ScalaComponent.static("TransactionsDetails")(<.div(<.h1("Деталі транзакцій")))

  // ------------- NAVIGATION BAR ----------------------------------------------------
  private val NavBar = ScalaComponent.builder[RouterCtl[AppPage]]("NavBar")
    .render_P { ctl =>
      <.nav(^.className := "navbar",
        <.ul(^.className := "nav-list",
          <.li(ctl.link(AccountsPage)(^.className := "nav-item", "Рахунки")),
          <.li(ctl.link(CategoriesPage)(^.className := "nav-item", "Категорії")),
          <.li(ctl.link(ProductsPage)(^.className := "nav-item", "Продукти")),
          <.li(ctl.link(TransactionsPage)(^.className := "nav-item", "Транзакції")),
          <.li(ctl.link(TransactionsDetailsPage)(^.className := "nav-item", "Деталі транзакцій"))
        )
      )
    }
    .build

  // Helper method to wrap pages with the NavBar
  private def layout(component: VdomElement) = ScalaComponent.builder[RouterCtl[AppPage]]("Layout")
    .render_P { ctl =>
      <.div(
        NavBar(ctl),
        <.div(^.className := "page-container", component)
      )
    }
    .build

  // ------------- ROUTER CONFIG -----------------------------------------------------
  private val config = RouterConfigDsl[AppPage].buildConfig { dsl =>
    import dsl._

    (
      staticRoute(root, AccountsPage)            ~> renderR(ctl => layout(AccountsComponent())(ctl)) |
      staticRoute("accounts", AccountsPage)     ~> renderR(ctl => layout(AccountsComponent())(ctl)) |
      staticRoute("categories", CategoriesPage) ~> renderR(ctl => layout(CategoriesComponent())(ctl)) |
      staticRoute("products", ProductsPage)     ~> renderR(ctl => layout(ProductsComponent())(ctl)) |
      staticRoute("transactions", TransactionsPage) ~> renderR(ctl => layout(TransactionsComponent())(ctl)) |
      staticRoute("transactions-details", TransactionsDetailsPage) ~> renderR(ctl => layout(TransactionsDetailsComponent())(ctl))
    )
        .notFound(redirectToPage(AccountsPage)(SetRouteVia.HistoryReplace)) // 404 → Home
  }

  private val baseUrl = BaseUrl.fromWindowOrigin_/

  // ------------- APPLICATION ROOT COMPONENT ---------------------------------------
  private val AppRouter = Router(baseUrl, config)

  def main(args: Array[String]): Unit = {
    // Mount application into #root (create if absent)
    val container = Option(dom.document.getElementById("root")).getOrElse {
      val div = dom.document.createElement("div")
      div.id = "root"
      dom.document.body.appendChild(div)
      div
    }

    AppRouter().renderIntoDOM(container)
  }
}
