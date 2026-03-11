use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId};
use rand;

/// Utilidades compartidas entre todos los bots.
/// Centraliza la lógica común para evitar duplicación de código.
pub struct BotUtils;

impl BotUtils {

    /// Busca si alguna casilla disponible da la victoria inmediata al jugador indicado.
    /// Prueba todas las casillas disponibles y devuelve la primera que gana.
    pub fn find_immediate_win(
        board: &GameY,
        available_cells: &Vec<u32>,
        player: PlayerId,
    ) -> Option<Coordinates> {
        for i in 0..available_cells.len() {
            let casilla = available_cells[i];
            let coordenadas = Self::to_coords(casilla, board);

            if Self::simulates_win(board, coordenadas, player) {
                return Some(coordenadas);
            }
        }
        None
    }

    /// Comprueba si poniendo una ficha en coords el jugador indicado ganaría.
    /// Simula el movimiento en una copia del tablero y comprueba el resultado.
    pub fn simulates_win(board: &GameY, coords: Coordinates, player: PlayerId) -> bool {
        let mut tablero_simulado = board.clone();
        let movimiento = Movement::Placement { player, coords };

        if tablero_simulado.add_move(movimiento).is_ok() {
            let estado = tablero_simulado.status();
            match estado {
                GameStatus::Finished { winner } => return *winner == player,
                _ => return false,
            }
        }
        false
    }

    /// Recibe un número de casilla y el tablero y devuelve sus Coordinates.
    /// Llama a from_index con el numero de la casilla y el tamaño del tablero.
    pub fn to_coords(cell: u32, board: &GameY) -> Coordinates {
        Coordinates::from_index(cell, board.board_size())
    }

    /// Devuelve una casilla aleatoria de entre las disponibles.
    pub fn elegir_al_azar(casillas: &Vec<u32>) -> u32 {
        let posicion_azar = rand::random_range(0..casillas.len());
        casillas[posicion_azar]
    }
}
