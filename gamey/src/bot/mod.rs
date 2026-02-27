//! Bot module for the Game of Y.
//!
//! This module provides the infrastructure for creating and managing AI bots
//! that can play the Game of Y. It includes:
//!
//! - [`YBot`] - A trait that defines the interface for all bots
//! - [`YBotRegistry`] - A registry for managing multiple bot implementations
//! - [`RandomBot`] - A simple bot that makes random valid moves

pub mod random;
pub mod ybot;
pub mod ybot_registry;

#[derive(Clone, Copy)]
pub enum Difficulty {
    Easy,
    Medium,
    Hard,
}

//Estrategias
pub mod offensive_bot;
pub mod defensive_bot;

//Expongo el contenido directamente en la raiz de bot:: para que otros archivos puedan importarlos
//con una ruta mas corta
pub use offensive_bot::*;
pub use defensive_bot::*;

pub use random::*;
pub use ybot::*;
pub use ybot_registry::*;
