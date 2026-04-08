package pruebas

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._


class TestCargaLogin extends Simulation {


  val uri1 = "localhost"


  private val httpProtocol = http
    .baseUrl("http://localhost")
    .inferHtmlResources()
    .acceptHeader("*/*")
    .acceptEncodingHeader("gzip, deflate, br")
    .acceptLanguageHeader("es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0")
  
  private val headers_0 = Map(
  		"Accept" -> "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  		"Priority" -> "u=0, i",
  		"Sec-Fetch-Dest" -> "document",
  		"Sec-Fetch-Mode" -> "navigate",
  		"Sec-Fetch-Site" -> "none",
  		"Sec-Fetch-User" -> "?1",
  		"Upgrade-Insecure-Requests" -> "1"
  )
  
  private val headers_1 = Map(
  		"Accept" -> "text/css,*/*;q=0.1",
  		"Priority" -> "u=2",
  		"Sec-Fetch-Dest" -> "style",
  		"Sec-Fetch-Mode" -> "cors",
  		"Sec-Fetch-Site" -> "same-origin"
  )
  
  private val headers_2 = Map(
  		"Sec-Fetch-Dest" -> "script",
  		"Sec-Fetch-Mode" -> "cors",
  		"Sec-Fetch-Site" -> "same-origin"
  )
  
  private val headers_3 = Map(
  		"Accept" -> "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
  		"Priority" -> "u=6",
  		"Sec-Fetch-Dest" -> "image",
  		"Sec-Fetch-Mode" -> "no-cors",
  		"Sec-Fetch-Site" -> "same-origin"
  )
  
  private val headers_4 = Map(
  		"Access-Control-Request-Headers" -> "content-type",
  		"Access-Control-Request-Method" -> "POST",
  		"Origin" -> "http://localhost",
  		"Priority" -> "u=4",
  		"Sec-Fetch-Dest" -> "empty",
  		"Sec-Fetch-Mode" -> "cors",
  		"Sec-Fetch-Site" -> "same-site"
  )
  
  private val headers_5 = Map(
  		"Content-Type" -> "application/json",
  		"Origin" -> "http://localhost",
  		"Priority" -> "u=0",
  		"Sec-Fetch-Dest" -> "empty",
  		"Sec-Fetch-Mode" -> "cors",
  		"Sec-Fetch-Site" -> "same-site"
  )


  private val scn = scenario("TestCargaLogin")
    .exec(
      http("request_0")
        .get("/")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("/assets/index-BWEhAp_X.css")
            .headers(headers_1),
          http("request_2")
            .get("/assets/index-dZ3IKswu.js")
            .headers(headers_2),
          http("request_3")
            .get("/vite.svg")
            .headers(headers_3)
        ),
      pause(5),
      http("request_4")
        .options("http://" + uri1 + ":3000/login")
        .headers(headers_4)
        .resources(
          http("request_5")
            .post("http://" + uri1 + ":3000/login")
            .headers(headers_5)
            .body(RawFileBody("pruebas/testcargalogin/0005_request.json"))
        )
    )

	setUp(
	  scn.inject(rampUsers(50).during(30.seconds)) 
	).protocols(httpProtocol)
}
