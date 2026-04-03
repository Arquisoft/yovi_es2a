use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
use crate::bot::bot_utils::BotUtils;

/// El Bot Monte Carlo: simula partidas aleatorias para estimar la mejor jugada.
/// Para cada casilla disponible, simula N partidas aleatorias y elige
/// la casilla con mayor tasa de victorias.
pub struct MonteCarloBot {
    pub my_player_id: PlayerId,
    pub opponent_id: PlayerId,
    /// Número de simulaciones por casilla candidata
    pub simulations: u32,
}

impl YBot for MonteCarloBot {

    // Función que devuelve el nombre del bot
    fn name(&self) -> &str {
        "monte_carlo_bot"
    }

    // Función principal. Se llama cada vez que es tu turno.
    // Devuelve Option<Coordinates>, es decir, devuelve Coordinates o None.
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        BotUtils::choose_move_with_strategy(board, |available_cells| {
            self.find_best_move(board, available_cells)
        })
    }
}

impl MonteCarloBot {

    /// Evalúa cada casilla disponible simulando partidas aleatorias
    /// y devuelve la casilla con mayor tasa de victorias.
    fn find_best_move(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        let mut best_coords = None;
        let mut best_wins = -1i32;

        for &casilla in available_cells.iter() {
            let coordenadas = BotUtils::to_coords(casilla, board);

            // Simulamos poner nuestra ficha en esta casilla
            let mut tablero_tras_jugada = board.clone();
            let movimiento = Movement::Placement {
                player: self.my_player_id,
                coords: coordenadas,
            };

            // Si el movimiento no es válido, lo saltamos
            if tablero_tras_jugada.add_move(movimiento).is_err() {
                continue;
            }

            // Si ya ganamos con esta jugada, la elegimos directamente
            if let GameStatus::Finished { winner } = tablero_tras_jugada.status() {
                if *winner == self.my_player_id {
                    return Some(coordenadas);
                }
            }

            // Simulamos N partidas aleatorias desde esta posición
            let wins = self.simulate(tablero_tras_jugada);

            if wins > best_wins {
                best_wins = wins;
                best_coords = Some(coordenadas);
            }
        }

        best_coords
    }

    /// Simula `self.simulations` partidas aleatorias desde el tablero dado
    /// y cuenta cuántas gana `my_player_id`.
    fn simulate(&self, board: GameY) -> i32 {
        let mut wins = 0i32;

        for _ in 0..self.simulations {
            if self.simulate_random_game(board.clone()) {
                wins += 1;
            }
        }

        wins
    }

    /// Simula una partida aleatoria hasta el final desde el tablero dado.
    /// Devuelve true si gana `my_player_id`, false si no.
    fn simulate_random_game(&self, mut board: GameY) -> bool {
        // Alternamos jugadores empezando por el oponente (ya jugamos nosotros)
        let mut current = self.opponent_id;

        loop {
            // Comprobamos si el juego ya terminó
            match board.status() {
                GameStatus::Finished { winner } => {
                    return *winner == self.my_player_id;
                }
                GameStatus::Ongoing { .. } => {}
            }

            let available = board.available_cells();
            if available.is_empty() {
                return false;
            }

            // Jugada aleatoria
            let casilla = BotUtils::elegir_al_azar(&available);
            let coords = BotUtils::to_coords(casilla, &board);
            let movimiento = Movement::Placement { player: current, coords };

            if board.add_move(movimiento).is_err() {
                return false;
            }

            // Alternamos jugador
            current = if current == self.my_player_id {
                self.opponent_id
            } else {
                self.my_player_id
            };
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Coordinates, GameY, Movement, PlayerId};

    fn make_bot() -> MonteCarloBot {
        MonteCarloBot {
            my_player_id: PlayerId::new(0),
            opponent_id: PlayerId::new(1),
            simulations: 10, // Pocas simulaciones para que los tests sean rápidos
        }
    }

    #[test]
    fn test_monte_carlo_name() {
        let bot = make_bot();
        assert_eq!(bot.name(), "monte_carlo_bot");
    }

    #[test]
    fn test_monte_carlo_returns_move_on_empty_board() {
        let bot = make_bot();
        let game = GameY::new(3);
        assert!(bot.choose_move(&game).is_some());
    }

    #[test]
    fn test_monte_carlo_returns_none_on_full_board() {
        let bot = make_bot();
        let mut game = GameY::new(1);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 0, 0),
        }).unwrap();
        assert!(bot.choose_move(&game).is_none());
    }

    #[test]
    fn test_monte_carlo_returns_valid_cell() {
        let bot = make_bot();
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        let idx = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&idx));
    }

    #[test]
    fn test_monte_carlo_takes_immediate_win() {
        let bot = make_bot();
        let mut game = GameY::new(3);

        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 0, 2),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(2, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 1, 1),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(1, 1, 0),
        }).unwrap();

        // El bot debe elegir (0,2,0) que es la victoria inmediata
        let chosen = bot.choose_move(&game).unwrap();
        let idx = chosen.to_index(game.board_size());
        let win_idx = Coordinates::new(0, 2, 0).to_index(game.board_size());
        assert_eq!(idx, win_idx);
    }

    #[test]
    fn test_monte_carlo_multiple_calls_always_valid() {
        let bot = make_bot();
        let game = GameY::new(5);
        for _ in 0..5 {
            let coords = bot.choose_move(&game).unwrap();
            let idx = coords.to_index(game.board_size());
            assert!(game.available_cells().contains(&idx));
        }
    }
}