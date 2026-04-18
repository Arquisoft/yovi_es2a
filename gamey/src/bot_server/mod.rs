//! HTTP server for Y game bots.
//!
//! This module provides an Axum-based REST API for querying Y game bots.
//! The server exposes endpoints for checking bot status and requesting moves.
//!
//! # Endpoints
//! - `GET /status` - Health check endpoint
//! - `POST /{api_version}/ybot/choose/{bot_id}` - Request a move from a bot
//! - `POST /v1/play` - Envía un tablero en YEN y recibe el movimiento del bot en YEN
//!
//! # Example
//! ```no_run
//! use gamey::run_bot_server;
//!
//! #[tokio::main]
//! async fn main() {
//!     if let Err(e) = run_bot_server(3000).await {
//!         eprintln!("Server error: {}", e);
//!     }
//! }
//! ```

pub mod choose;
pub mod error;
pub mod state;
pub mod version;
pub mod game_routes;

use axum::http::Method;

use axum::response::IntoResponse;
use std::sync::Arc;
// CORS (Cross-Origin Resource Sharing)
use tower_http::cors::{Any, CorsLayer};

pub use choose::MoveResponse;
pub use error::ErrorResponse;
pub use version::*;

use crate::{GameYError, RandomBot, YBotRegistry, PlayerId, state::AppState};
use crate::bot::monte_carlo_bot::MonteCarloBot;

/// Creates the Axum router with the given state.
///
/// This is useful for testing the API without binding to a network port.
pub fn create_router(state: AppState) -> axum::Router {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any)
        .allow_origin(Any);

    axum::Router::new()
        .route("/status", axum::routing::get(status))
        // ── API de bots (original) ───────────────────────────────────────────
        .route(
            "/{api_version}/ybot/choose/{bot_id}",
            axum::routing::post(choose::choose),
        )
        // ── API de juego ─────────────────────────────────────────────────────
        .route("/game/new",                axum::routing::post(game_routes::create_game))
        .route("/game/{game_id}",          axum::routing::get(game_routes::get_game))
        .route("/game/{game_id}/move",     axum::routing::post(game_routes::make_move))
        // ── API para bots externos (nuevo) ───────────────────────────────────
        .route("/play", axum::routing::get(game_routes::play_competition))
        .layer(cors)
        .with_state(state)
}

/// Creates the default application state with the standard bot registry.
///
/// The default state includes the `RandomBot` which selects moves randomly.
pub fn create_default_state() -> AppState {
    use crate::bot::{Difficulty, DefensiveBot, OffensiveBot, PositionalBot};

    let bots = YBotRegistry::new()
        .with_bot(Arc::new(RandomBot))
        // Defensive
        .with_bot(Arc::new(DefensiveBot { my_player_id: PlayerId::new(0), opponent_id: PlayerId::new(1), difficulty: Difficulty::Easy }))
        .with_bot(Arc::new(DefensiveBot { my_player_id: PlayerId::new(0), opponent_id: PlayerId::new(1), difficulty: Difficulty::Medium }))
        .with_bot(Arc::new(DefensiveBot { my_player_id: PlayerId::new(0), opponent_id: PlayerId::new(1), difficulty: Difficulty::Hard }))
        // Offensive
        .with_bot(Arc::new(OffensiveBot { my_player_id: PlayerId::new(0), difficulty: Difficulty::Easy }))
        .with_bot(Arc::new(OffensiveBot { my_player_id: PlayerId::new(0), difficulty: Difficulty::Medium }))
        .with_bot(Arc::new(OffensiveBot { my_player_id: PlayerId::new(0), difficulty: Difficulty::Hard }))
        // Positional
        .with_bot(Arc::new(PositionalBot { my_player_id: PlayerId::new(0), opponent_id: PlayerId::new(1), difficulty: Difficulty::Easy }))
        .with_bot(Arc::new(PositionalBot { my_player_id: PlayerId::new(0), opponent_id: PlayerId::new(1), difficulty: Difficulty::Medium }))
        .with_bot(Arc::new(PositionalBot { my_player_id: PlayerId::new(0), opponent_id: PlayerId::new(1), difficulty: Difficulty::Hard }))
        .with_bot(Arc::new(MonteCarloBot {
            my_player_id: PlayerId::new(0),
            opponent_id: PlayerId::new(1),
            simulations: 150,
        }));

    AppState::new(bots)
}

/// Starts the bot server on the specified port.
pub async fn run_bot_server(port: u16) -> Result<(), GameYError> {
    let state = create_default_state();
    let app = create_router(state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| GameYError::ServerError {
            message: format!("Failed to bind to {}: {}", addr, e),
        })?;

    println!("Server mode: Listening on http://{}", addr);
    axum::serve(listener, app)
        .await
        .map_err(|e| GameYError::ServerError {
            message: format!("Server error: {}", e),
        })?;

    Ok(())
}

/// Health check endpoint handler.
pub async fn status() -> impl IntoResponse {
    "OK"
}