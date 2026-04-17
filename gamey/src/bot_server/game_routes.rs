// Este fichero contiene las rutas de la API HTTP para gestionar partidas.
// Cada función pública corresponde a un endpoint REST 

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    Coordinates, GameAction, GameStatus, GameY, Movement, PlayerId, YBot, YEN,
    bot_server::state::AppState,
};

// ─── Tipos de Request  ─────────────────────────────────────────────

/// Cuerpo de la petición para crear un nuevo juego.
/// Todos los campos son opcionales: si no se envían se usan los valores por defecto.
#[derive(Debug, Deserialize)]
pub struct CreateGameRequest {
    /// Tamaño del tablero (longitud de un lado). Por defecto: 7.
    #[serde(default = "default_board_size")]
    pub size: u32,
    /// Modo de juego: "human" (2 jugadores) o "computer" (humano vs bot).
    #[serde(default = "default_mode")]
    pub mode: String,
    /// Identificador del bot cuando mode == "computer". Por defecto: "random_bot".
    #[serde(default = "default_bot")]
    pub bot: String,
    pub timer: Option<u32>,
}

fn default_board_size() -> u32 { 7 }
fn default_mode() -> String { "computer".to_string() }
fn default_bot() -> String { "random_bot".to_string() }

/// Estado de una celda individual del tablero.
#[derive(Debug, Serialize)]
pub struct CellState {
    /// Índice lineal de la celda (0..total_cells).
    pub index: u32,
    /// Coordenadas baricéntricas [x, y, z].
    pub coords: [u32; 3],
    /// `null` si está vacía; 0 o 1 si está ocupada por un jugador.
    pub player: Option<u32>,
}

/// Estado completo del juego devuelto por los endpoints GET y POST.
#[derive(Debug, Serialize)]
pub struct GameStateResponse {
    pub game_id: String,
    pub board_size: u32,
    pub total_cells: u32,
    /// Todas las celdas con su ocupación.
    pub cells: Vec<CellState>,
    /// Índices de las celdas aún disponibles para jugar.
    pub available_cells: Vec<u32>,
    /// "ongoing" o "finished".
    pub status: String,
    /// Jugador que debe mover a continuación (`null` si el juego terminó).
    pub next_player: Option<u32>,
    /// Ganador (`null` si el juego sigue en curso).
    pub winner: Option<u32>,
}

/// Resumen de un movimiento aplicado (humano o bot).
#[derive(Debug, Serialize)]
pub struct AppliedMove {
    pub player: u32,
    /// "place" o "resign".
    pub action: String,
    /// Índice de la celda elegida; `null` para resign.
    pub cell_index: Option<u32>,
}

/// Respuesta tras aplicar un movimiento.
#[derive(Debug, Serialize)]
pub struct MakeMoveResponse {
    /// El movimiento del jugador humano que se acaba de aplicar.
    pub applied_move: AppliedMove,
    /// Respuesta automática del bot, si se solicitó y el juego no ha terminado.
    pub bot_move: Option<AppliedMove>,
    /// Estado completo del tablero tras todos los movimientos.
    pub game_state: GameStateResponse,
}

/// Cuerpo de la petición para realizar un movimiento.
#[derive(Debug, Deserialize)]
pub struct MakeMoveRequest {
    /// El jugador que mueve (0 o 1).
    pub player: u32,
    /// "place" o "resign".
    pub action: String,
    /// Obligatorio cuando action == "place": índice lineal de la celda.
    pub cell_index: Option<u32>,
    /// Si se incluye, el bot nombrado jugará automáticamente después del humano.
    pub bot: Option<String>,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Construye un `GameStateResponse` a partir del estado actual de un `GameY`.
///
/// Usa la conversión a YEN para leer la ocupación del tablero, ya que
/// `board_map` es privado en `GameY`.
pub fn build_game_state(game_id: Uuid, game: &GameY) -> GameStateResponse {
    let size = game.board_size();
    let total = game.total_cells();

    let cells = build_cells_from_yen(game, size, total);

    let (status_str, next_player, winner) = match game.status() {
        GameStatus::Ongoing { next_player } => {
            ("ongoing".to_string(), Some(next_player.id()), None)
        }
        GameStatus::Finished { winner } => {
            ("finished".to_string(), None, Some(winner.id()))
        }
    };

    GameStateResponse {
        game_id: game_id.to_string(),
        board_size: size,
        total_cells: total,
        cells,
        available_cells: game.available_cells().clone(),
        status: status_str,
        next_player,
        winner,
    }
}

/// Deriva la ocupación de cada celda usando el round-trip YEN,
/// ya que `board_map` es privado en `GameY`.
///
/// El layout YEN tiene la forma "X/XX/XXX/..." donde cada carácter
/// es '.', 'B' (jugador 0) o 'R' (jugador 1).
fn build_cells_from_yen(game: &GameY, size: u32, total: u32) -> Vec<CellState> {
    let yen: YEN = game.into();
    let layout_chars: Vec<char> = yen.layout().chars().filter(|&c| c != '/').collect();

    (0..total)
        .map(|idx| {
            let coords = Coordinates::from_index(idx, size);
            let player = layout_chars.get(idx as usize).and_then(|&c| match c {
                'B' => Some(0u32),
                'R' => Some(1u32),
                _ => None,
            });
            CellState {
                index: idx,
                coords: [coords.x(), coords.y(), coords.z()],
                player,
            }
        })
        .collect()
}

// ─── Handlers (endpoints) ─────────────────────────────────────────────────────

/// `POST /v1/game`
///
/// Crea una nueva partida y devuelve su estado inicial.
///
/// ### Ejemplo de body (todos los campos son opcionales)
/// ```json
/// { "size": 7, "mode": "human" }
/// { "size": 5, "mode": "computer", "bot": "random_bot" }
/// ```
pub async fn create_game(
    State(state): State<AppState>,
    Json(req): Json<CreateGameRequest>,
) -> impl IntoResponse {
    let game_id = Uuid::new_v4();
    let game = GameY::new(req.size, req.timer);

    let games_arc = state.games();
    let mut games = games_arc.lock().await;
    games.insert(game_id, game);
    let response = build_game_state(game_id, &games[&game_id]);
    (StatusCode::CREATED, Json(response))
}

/// `GET /v1/game/{game_id}`
///
/// Devuelve el estado actual de una partida existente.
pub async fn get_game(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
) -> impl IntoResponse {
    let games_arc = state.games();
    let games = games_arc.lock().await;
    match games.get(&game_id) {
        None => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "Partida no encontrada",
                "game_id": game_id.to_string()
            })),
        )
            .into_response(),
        Some(game) => {
            let response = build_game_state(game_id, game);
            (StatusCode::OK, Json(response)).into_response()
        }
    }
}

/// `POST /v1/game/{game_id}/move`
///
/// Aplica un movimiento al juego. Si se incluye el campo `bot` en el body,
/// el bot jugará su turno automáticamente después del humano.
///
/// ### Ejemplos de body
/// ```json
/// { "player": 0, "action": "place", "cell_index": 12 }
/// { "player": 0, "action": "resign" }
/// { "player": 0, "action": "place", "cell_index": 12, "bot": "random_bot" }
/// ```
pub async fn make_move(
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
    Json(req): Json<MakeMoveRequest>,
) -> impl IntoResponse {
    let games_arc = state.games();
    let mut games = games_arc.lock().await;

    let game = match games.get_mut(&game_id) {
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "Partida no encontrada" })),
            )
                .into_response();
        }
        Some(g) => g,
    };

    let player = PlayerId::new(req.player);

    // Construir el movimiento según la acción indicada
    let movement = match req.action.as_str() {
        "resign" => Movement::Action {
            player,
            action: GameAction::Resign,
        },
        "timeout" => Movement::Action {
            player,
            action: GameAction::Timeout,
        },
        "place" => {
            let idx = match req.cell_index {
                Some(i) => i,
                None => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(serde_json::json!({
                            "error": "cell_index es obligatorio para la acción 'place'"
                        })),
                    )
                        .into_response();
                }
            };
            let coords = Coordinates::from_index(idx, game.board_size());
            Movement::Placement { player, coords }
        }
        other => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": format!("Acción desconocida: '{}'. Usa 'place' o 'resign'.", other)
                })),
            )
                .into_response();
        }
    };

    let human_applied = AppliedMove {
        player: req.player,
        action: req.action.clone(),
        cell_index: req.cell_index,
    };

    // Aplicar el movimiento del humano
    if let Err(e) = game.add_move(movement) {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response();
    }

    // Si se pidió bot y el juego no ha terminado, el bot juega automáticamente
    let bot_applied = match req.bot {
        Some(ref bot_id) if !game.check_game_over() => {
            match state.bots().find(bot_id) {
                None => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(serde_json::json!({
                            "error": format!("Bot '{}' no encontrado", bot_id)
                        })),
                    )
                        .into_response();
                }
                Some(bot) => trigger_bot_move(game, bot.as_ref()),
            }
        }
        _ => None,
    };

    let game_state = build_game_state(game_id, game);
    let response = MakeMoveResponse {
        applied_move: human_applied,
        bot_move: bot_applied,
        game_state,
    };
    (StatusCode::OK, Json(response)).into_response()
}

// ─── Lógica interna ───────────────────────────────────────────────────────────

/// Pide al bot un movimiento y lo aplica al juego.
/// Devuelve un resumen del movimiento si tiene éxito.
fn trigger_bot_move(game: &mut GameY, bot: &dyn YBot) -> Option<AppliedMove> {
    let bot_coords = bot.choose_move(game)?;
    let bot_player = game.next_player()?;
    let idx = bot_coords.to_index(game.board_size());
    let movement = Movement::Placement {
        player: bot_player,
        coords: bot_coords,
    };
    match game.add_move(movement) {
        Ok(()) => Some(AppliedMove {
            player: bot_player.id(),
            action: "place".to_string(),
            cell_index: Some(idx),
        }),
        Err(e) => {
            tracing::error!("El movimiento del bot falló: {}", e);
            None
        }
    }
}

// ─── Endpoint /v1/play ────────────────────────────────────────────────────────
 
/// Cuerpo de la petición para el endpoint play.
/// Permite que un bot externo juegue contra nuestra IA enviando un tablero en YEN.
#[derive(Debug, Deserialize)]
pub struct PlayRequest {
    /// Estado actual del tablero en notación YEN.
    /// Ejemplo: "./../..." para un tablero de tamaño 3 vacío.
    pub position: String,
    /// Bot que responderá al movimiento. Por defecto: "random_bot".
    #[serde(default = "default_bot")]
    pub bot: String,
    /// Jugador que debe mover (0 o 1). Por defecto: 0.
    #[serde(default = "default_player")]
    pub player: u32,
}
 
fn default_player() -> u32 { 0 }
 
/// Respuesta del endpoint play.
#[derive(Debug, Serialize)]
pub struct PlayResponse {
    /// Notación YEN del tablero tras el movimiento del bot.
    pub position: String,
    /// Índice de la celda donde jugó el bot.
    pub cell_index: u32,
    /// Estado de la partida: "ongoing" o "finished".
    pub status: String,
    /// Ganador si la partida terminó, null si sigue.
    pub winner: Option<u32>,
}
 
/// `POST /v1/play`
///
/// Recibe un tablero en notación YEN y devuelve el siguiente movimiento del bot
/// también en notación YEN. Permite que bots externos jueguen contra nuestra IA.
///
/// ### Ejemplo de request
/// ```json
/// {
///   "position": "./../...",
///   "bot": "defensive_hard",
///   "player": 0
/// }
/// ```
///
/// ### Ejemplo de response
/// ```json
/// {
///   "position": "./../.B.",
///   "cell_index": 5,
///   "status": "ongoing",
///   "winner": null
/// }
/// ```
pub async fn play(
    State(state): State<AppState>,
    Json(req): Json<PlayRequest>,
) -> impl IntoResponse {
    // 1. Parsear el YEN recibido para reconstruir el tablero
    let yen = match parse_yen_from_string(&req.position) {
        Ok(y) => y,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": format!("YEN inválido: {}", e) })),
            ).into_response();
        }
    };
 
    let mut game = match GameY::try_from(yen) {
        Ok(g) => g,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": format!("No se pudo reconstruir el tablero: {}", e) })),
            ).into_response();
        }
    };
 
    // 2. Buscar el bot solicitado
    let bot = match state.bots().find(&req.bot) {
        Some(b) => b,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": format!("Bot '{}' no encontrado", req.bot) })),
            ).into_response();
        }
    };
 
    // 3. Si el juego ya terminó, devolver error
    if game.check_game_over() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "La partida ya ha terminado" })),
        ).into_response();
    }
 
    // 4. El bot elige su movimiento
    let bot_coords = match bot.choose_move(&game) {
        Some(c) => c,
        None => {
            return (
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(serde_json::json!({ "error": "El bot no pudo elegir un movimiento (tablero lleno?)" })),
            ).into_response();
        }
    };
 
    let bot_player = match game.next_player() {
        Some(p) => p,
        None => {
            return (
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(serde_json::json!({ "error": "No hay jugador activo" })),
            ).into_response();
        }
    };
 
    let cell_index = bot_coords.to_index(game.board_size());
    let movement = Movement::Placement { player: bot_player, coords: bot_coords };
 
    // 5. Aplicar el movimiento
    if let Err(e) = game.add_move(movement) {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(serde_json::json!({ "error": e.to_string() })),
        ).into_response();
    }
 
    // 6. Construir la respuesta con el nuevo YEN
    let new_yen: YEN = (&game).into();
    let (status_str, winner) = match game.status() {
        GameStatus::Ongoing { .. } => ("ongoing".to_string(), None),
        GameStatus::Finished { winner } => ("finished".to_string(), Some(winner.id())),
    };
 
    let response = PlayResponse {
        position: new_yen.layout().to_string(),
        cell_index,
        status: status_str,
        winner,
    };
 
    (StatusCode::OK, Json(response)).into_response()
}
 
/// Parsea una cadena YEN en el formato "row1/row2/row3"
/// y deduce el tamaño del tablero a partir del número de filas.
fn parse_yen_from_string(position: &str) -> Result<YEN, String> {
    let rows: Vec<&str> = position.split('/').collect();
    let size = rows.len() as u32;
    if size == 0 {
        return Err("El YEN no puede estar vacío".to_string());
    }
    Ok(YEN::new(size, 0, vec!['B', 'R'], position.to_string()))
}