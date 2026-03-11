use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId};
use rand;

/// Utilidades compartidas entre todos los bots.
/// Centraliza la lógica común para evitar duplicación de código.
pub struct BotUtils;

impl BotUtils {

    /// Lógica común de choose_move: obtiene casillas disponibles y llama al callback de estrategia.
    /// Todos los bots tienen el mismo patrón: si no hay casillas, None; si hay, delega en la dificultad.
    pub fn choose_move_with_strategy<F>(board: &GameY, strategy: F) -> Option<Coordinates>
    where
        F: FnOnce(&Vec<u32>) -> Option<Coordinates>,
    {
        //Le pedimos a board que nos de un vector con los índices de las casillas vacias.
        let available_cells = board.available_cells();

        //Si no hay casillas vacias (tablero lleno) devolvemos None
        if available_cells.is_empty() {
            return None;
        }

        strategy(&available_cells)
    }

    /// Busca si alguna casilla disponible da la victoria inmediata al jugador indicado.
    /// Prueba todas las casillas disponibles y devuelve la primera que gana.
    pub fn find_immediate_win(
        board: &GameY,
        available_cells: &Vec<u32>,
        player: PlayerId,
    ) -> Option<Coordinates> {
        available_cells.iter().find_map(|&casilla| {
            let coordenadas = Self::to_coords(casilla, board);
            if Self::simulates_win(board, coordenadas, player) {
                Some(coordenadas)
            } else {
                None
            }
        })
    }

    /// Busca una casilla que abra N o más caminos de victoria para el jugador indicado.
    /// Útil para detectar y crear "tenedores" (dobles amenazas).
    pub fn find_fork_move(
        board: &GameY,
        available_cells: &Vec<u32>,
        player: PlayerId,
        min_threats: usize,
    ) -> Option<Coordinates> {
        for &casilla in available_cells.iter() {
            let coordenadas = Self::to_coords(casilla, board);
            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {
                // Contamos cuántos caminos ganadores se abren tras este movimiento
                let casillas_futuras = tablero_simulado.available_cells();
                let amenazas = casillas_futuras.iter()
                    .filter(|&&c| Self::simulates_win(&tablero_simulado, Self::to_coords(c, &tablero_simulado), player))
                    .count();

                if amenazas >= min_threats {
                    return Some(coordenadas);
                }
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
    pub fn to_coords(cell: u32, board: &GameY) -> Coordinates {
        Coordinates::from_index(cell, board.board_size())
    }

    /// Devuelve una casilla aleatoria de entre las disponibles.
    pub fn elegir_al_azar(casillas: &Vec<u32>) -> u32 {
        let posicion_azar = rand::random_range(0..casillas.len());
        casillas[posicion_azar]
    }
}
