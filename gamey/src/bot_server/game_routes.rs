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

use axum::extract::Query;

use crate::{
    Coordinates, GameAction, GameStatus, GameY, Movement, PlayerId, YBot, YEN,
    bot_server::state::AppState,
};

// ─── Tipos de Request  ─────────────────────────────────────────────

/// Cuerpo de la petición para crear un nuevo juego.
/// Todos los campos son opcionales: si no se envían se usan los valores por defecto.
#[derive(Debug, Deserialize)]
pub struct CreateGameRequest {
    #[serde(default = "default_board_size")]
    pub size: u32,
    #[serde(default = "default_mode")]
    pub mode: String,
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

/// `GET /game/{game_id}`
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

/// `POST /game/{game_id}/move``
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

// ─── Endpoint /play ────────────────────────────────────────────────────────
 
// 1. Lo que recibimos en la URL (?position={...}&bot_id=...)
#[derive(Debug, Deserialize)]
pub struct CompetitionPlayQuery {
    pub position: String,
    pub bot_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct YenPosition {
    pub size: u32,
    pub turn: u32,
    pub players: Vec<char>,
    pub layout: String,
}

#[derive(Debug, Serialize)]
pub struct CompetitionResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coords: Option<Coords3D>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Coords3D {
    pub x: u32,
    pub y: u32,
    pub z: u32,
}

/// GET /play
pub async fn play_competition(
    State(state): State<AppState>,
    Query(query): Query<CompetitionPlayQuery>,
) -> impl IntoResponse {
    
    let yen_data: YenPosition = match serde_json::from_str(&query.position) {
        Ok(data) => data,
        Err(e) => return (StatusCode::BAD_REQUEST, format!("Invalid JSON in position: {}", e)).into_response(),
    };

    let yen = YEN::new(yen_data.size, yen_data.turn, yen_data.players, yen_data.layout);
    
    let game = match GameY::try_from(yen) {
        Ok(g) => g,
        Err(e) => return (StatusCode::BAD_REQUEST, format!("Invalid board: {}", e)).into_response(),
    };

    // 3. Seleccionamos el bot (si no pasan bot_id, usamos el random)
    let bot_name = query.bot_id.unwrap_or_else(|| "random_bot".to_string());
    let bot = match state.bots().find(&bot_name) {
        Some(b) => b,
        None => return (StatusCode::BAD_REQUEST, format!("Bot {} not found", bot_name)).into_response(),
    };

    if game.check_game_over() {
        let resp = CompetitionResponse { coords: None, action: Some("resign".to_string()) };
        return (StatusCode::OK, Json(resp)).into_response();
    }

    match bot.choose_move(&game) {
        Some(coords) => {
            let resp = CompetitionResponse {
                coords: Some(Coords3D {
                    x: coords.x, 
                    y: coords.y, 
                    z: coords.z  
                }),
                action: None,
            };
            (StatusCode::OK, Json(resp)).into_response()
        },
        None => {
            let resp = CompetitionResponse { coords: None, action: Some("resign".to_string()) };
            (StatusCode::OK, Json(resp)).into_response()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{bot_server::state::AppState, GameY, RandomBot, YBotRegistry};
    use axum::{
        extract::{Json, Path, Query, State},
        http::StatusCode,
        response::IntoResponse,
    };
    use std::sync::Arc;
    use uuid::Uuid;

    // TESTS DE CREACIÓN Y OBTENCIÓN DE PARTIDAS
    #[test]
    fn test_defaults() {
        assert_eq!(default_board_size(), 7);
        assert_eq!(default_mode(), "computer");
        assert_eq!(default_bot(), "random_bot");
    }

    #[tokio::test]
    async fn test_create_game_success() {
        let state = AppState::new(YBotRegistry::new());
        let req = CreateGameRequest {
            size: 7,
            mode: "human".to_string(),
            bot: "random_bot".to_string(),
            timer: None,
        };

        let response = create_game(State(state.clone()), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::CREATED);

        let games_arc = state.games();
        let games = games_arc.lock().await;
        assert_eq!(games.len(), 1);
    }

    #[tokio::test]
    async fn test_get_game_success() {
        let state = AppState::new(YBotRegistry::new());
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            games.insert(game_id, GameY::new(7, None));
        }

        let response = get_game(State(state), Path(game_id)).await.into_response();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_get_game_not_found() {
        let state = AppState::new(YBotRegistry::new());
        let response = get_game(State(state), Path(Uuid::new_v4())).await.into_response();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    // TESTS DE MOVIMIENTOS (MAKE_MOVE)

    #[tokio::test]
    async fn test_make_move_success_place() {
        let state = AppState::new(YBotRegistry::new());
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            games.insert(game_id, GameY::new(7, None));
        }

        let req = MakeMoveRequest {
            player: 0,
            action: "place".to_string(),
            cell_index: Some(0),
            bot: None,
        };

        let response = make_move(State(state), Path(game_id), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_make_move_success_resign() {
        let state = AppState::new(YBotRegistry::new());
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            games.insert(game_id, GameY::new(7, None));
        }

        let req = MakeMoveRequest {
            player: 0,
            action: "resign".to_string(),
            cell_index: None,
            bot: None,
        };

        let response = make_move(State(state), Path(game_id), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_make_move_missing_cell_index() {
        let state = AppState::new(YBotRegistry::new());
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            games.insert(game_id, GameY::new(7, None));
        }

        let req = MakeMoveRequest {
            player: 0,
            action: "place".to_string(),
            cell_index: None, // Provoca BAD_REQUEST
            bot: None,
        };

        let response = make_move(State(state), Path(game_id), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_make_move_invalid_action() {
        let state = AppState::new(YBotRegistry::new());
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            games.insert(game_id, GameY::new(7, None));
        }

        let req = MakeMoveRequest {
            player: 0,
            action: "voltereta".to_string(),
            cell_index: Some(0),
            bot: None,
        };

        let response = make_move(State(state), Path(game_id), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_make_move_bot_success() {
        let registry = YBotRegistry::new().with_bot(Arc::new(RandomBot));
        let state = AppState::new(registry);
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            games.insert(game_id, GameY::new(7, None));
        }

        let req = MakeMoveRequest {
            player: 0,
            action: "place".to_string(),
            cell_index: Some(0),
            bot: Some("random_bot".to_string()),
        };

        let response = make_move(State(state), Path(game_id), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_make_move_bot_not_found() {
        let state = AppState::new(YBotRegistry::new()); // Sin bots registrados
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            games.insert(game_id, GameY::new(7, None));
        }

        let req = MakeMoveRequest {
            player: 0,
            action: "place".to_string(),
            cell_index: Some(0),
            bot: Some("bot_inexistente".to_string()),
        };

        let response = make_move(State(state), Path(game_id), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_make_move_occupied_cell() {
        let state = AppState::new(YBotRegistry::new());
        let game_id = Uuid::new_v4();
        {
            let games_arc = state.games();
            let mut games = games_arc.lock().await;
            let mut game = GameY::new(7, None);
            // Ocupamos la celda 0
            game.add_move(crate::Movement::Placement {
                player: crate::PlayerId::new(0),
                coords: crate::Coordinates::from_index(0, 7),
            }).unwrap();
            games.insert(game_id, game);
        }

        let req = MakeMoveRequest {
            player: 1,
            action: "place".to_string(),
            cell_index: Some(0),
            bot: None,
        };

        let response = make_move(State(state), Path(game_id), Json(req)).await.into_response();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY); // Error 422
    }


    // TESTS DEL TORNEO (PLAY_COMPETITION)
    #[tokio::test]
    async fn test_play_competition_success() {
        let registry = YBotRegistry::new().with_bot(Arc::new(RandomBot));
        let state = AppState::new(registry);
        
        let yen_json = serde_json::json!({
            "size": 3,
            "turn": 0,
            "players": ["B", "R"],
            "layout": "B/BB/BBR"
        }).to_string();

        let query = CompetitionPlayQuery {
            position: yen_json,
            bot_id: Some("random_bot".to_string()),
        };

        let response = play_competition(State(state), Query(query)).await.into_response();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_play_competition_invalid_json() {
        let state = AppState::new(YBotRegistry::new());
        let query = CompetitionPlayQuery {
            position: "esto_no_es_json".to_string(),
            bot_id: None,
        };

        let response = play_competition(State(state), Query(query)).await.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_play_competition_bot_not_found() {
        let state = AppState::new(YBotRegistry::new());
        let yen_json = serde_json::json!({
            "size": 1,
            "turn": 0,
            "players": ["B", "R"],
            "layout": "."
        }).to_string();

        let query = CompetitionPlayQuery {
            position: yen_json,
            bot_id: Some("bot_falso".to_string()),
        };

        let response = play_competition(State(state), Query(query)).await.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_play_competition_game_already_over() {
        let registry = YBotRegistry::new().with_bot(Arc::new(RandomBot));
        let state = AppState::new(registry);
        
        let yen_json = serde_json::json!({
            "size": 2,
            "turn": 0,
            "players": ["B", "R"],
            "layout": "B/BB"
        }).to_string();

        let query = CompetitionPlayQuery {
            position: yen_json,
            bot_id: Some("random_bot".to_string()),
        };

        let response = play_competition(State(state), Query(query)).await.into_response();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
