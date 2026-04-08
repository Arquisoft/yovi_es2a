package pruebas

import scala.concurrent.duration._
import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class TestCargaLoginJugar extends Simulation {

  private val uri1 = "localhost"

  private val httpProtocol = http
    .baseUrl("http://localhost:4000")
    .inferHtmlResources()
    .acceptHeader("*/*")
    .acceptEncodingHeader("gzip, deflate, br")
    .acceptLanguageHeader("es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0")
  
  private val headers_0 = Map(
      "Accept" -> "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "If-Modified-Since" -> "Wed, 08 Apr 2026 18:37:36 GMT",
      "If-None-Match" -> """"69d6a070-1d2"""",
      "Priority" -> "u=0, i",
      "Sec-Fetch-Dest" -> "document",
      "Sec-Fetch-Mode" -> "navigate",
      "Sec-Fetch-Site" -> "none",
      "Sec-Fetch-User" -> "?1",
      "Upgrade-Insecure-Requests" -> "1"
  )
  
  private val headers_1 = Map(
      "Accept" -> "text/css,*/*;q=0.1",
      "If-Modified-Since" -> "Wed, 08 Apr 2026 18:37:36 GMT",
      "If-None-Match" -> """"69d6a070-2dcc"""",
      "Priority" -> "u=2",
      "Sec-Fetch-Dest" -> "style",
      "Sec-Fetch-Mode" -> "cors",
      "Sec-Fetch-Site" -> "same-origin"
  )
  
  private val headers_2 = Map(
      "If-Modified-Since" -> "Wed, 08 Apr 2026 18:37:36 GMT",
      "If-None-Match" -> """"69d6a070-31455"""",
      "Sec-Fetch-Dest" -> "script",
      "Sec-Fetch-Mode" -> "cors",
      "Sec-Fetch-Site" -> "same-origin"
  )
  
  private val headers_3 = Map(
      "Access-Control-Request-Headers" -> "content-type",
      "Access-Control-Request-Method" -> "POST",
      "Origin" -> "http://localhost",
      "Priority" -> "u=4",
      "Sec-Fetch-Dest" -> "empty",
      "Sec-Fetch-Mode" -> "cors",
      "Sec-Fetch-Site" -> "same-site"
  )
  
  private val headers_4 = Map(
      "Content-Type" -> "application/json",
      "Origin" -> "http://localhost",
      "Priority" -> "u=0",
      "Sec-Fetch-Dest" -> "empty",
      "Sec-Fetch-Mode" -> "cors",
      "Sec-Fetch-Site" -> "same-site"
  )
  
  private val headers_6 = Map(
      "Content-Type" -> "application/json",
      "Origin" -> "http://localhost",
      "Priority" -> "u=4",
      "Sec-Fetch-Dest" -> "empty",
      "Sec-Fetch-Mode" -> "cors",
      "Sec-Fetch-Site" -> "same-site"
  )

  private val scn = scenario("TestCargaLoginJugar")
    .exec(
      http("request_0")
        .get("http://" + uri1 + "/")
        .headers(headers_0)
        .resources(
          http("request_1")
            .get("http://" + uri1 + "/assets/index-BWEhAp_X.css")
            .headers(headers_1),
          http("request_2")
            .get("http://" + uri1 + "/assets/index-dZ3IKswu.js")
            .headers(headers_2)
        ),
      pause(6),
      http("request_3")
        .options("http://" + uri1 + ":3000/login")
        .headers(headers_3)
        .resources(
          http("request_4")
            .post("http://" + uri1 + ":3000/login")
            .headers(headers_4)
            .body(RawFileBody("pruebas/testcargaloginjugar/0004_request.json"))
        ),
      pause(3),
      http("request_5")
        .options("/game/new")
        .headers(headers_3)
        .resources(
          http("request_6")
            .post("/game/new")
            .headers(headers_6)
            .body(RawFileBody("pruebas/testcargaloginjugar/0006_request.json"))
        ),
      pause(1),
      http("request_7")
        .options("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
        .headers(headers_3)
        .resources(
          http("request_8")
            .post("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
            .headers(headers_4)
            .body(RawFileBody("pruebas/testcargaloginjugar/0008_request.json")),
          http("request_9")
            .options("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
            .headers(headers_3),
          http("request_10")
            .post("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
            .headers(headers_4)
            .body(RawFileBody("pruebas/testcargaloginjugar/0010_request.json"))
        ),
      pause(1),
      http("request_11")
        .options("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
        .headers(headers_3)
        .resources(
          http("request_12")
            .post("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
            .headers(headers_4)
            .body(RawFileBody("pruebas/testcargaloginjugar/0012_request.json"))
        ),
      pause(1),
      http("request_13")
        .options("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
        .headers(headers_3)
        .resources(
          http("request_14")
            .post("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
            .headers(headers_4)
            .body(RawFileBody("pruebas/testcargaloginjugar/0014_request.json")),
          http("request_15")
            .options("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
            .headers(headers_3),
          http("request_16")
            .post("/game/07b7d0ff-202e-439a-b5a6-f851c3291178/move")
            .headers(headers_4)
            .body(RawFileBody("pruebas/testcargaloginjugar/0016_request.json")),
          http("request_17")
            .options("http://" + uri1 + ":3000/savegame")
            .headers(headers_3),
          http("request_18")
            .post("http://" + uri1 + ":3000/savegame")
            .headers(headers_6)
            .body(RawFileBody("pruebas/testcargaloginjugar/0018_request.json"))
        )
    )

  setUp(
    scn.inject(rampUsers(50).during(30.seconds))
  ).protocols(httpProtocol)
}