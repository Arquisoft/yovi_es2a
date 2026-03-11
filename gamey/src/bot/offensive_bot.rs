use crate::{Coordinates, GameY, Movement, PlayerId, YBot};
use crate::bot::Difficulty;
use crate::bot::bot_utils::BotUtils;

// El Bot Ofensivo: solo quiere conectar los 3 lados ignorando al rival.
pub struct OffensiveBot {
    pub my_player_id: PlayerId,
    pub difficulty: Difficulty,
}

impl YBot for OffensiveBot {

    // Función que devuelve el nombre del bot.
    fn name(&self) -> &str {
        match &self.difficulty {
            Difficulty::Easy => "offensive_easy",
            Difficulty::Medium => "offensive_medium",
            Difficulty::Hard => "offensive_hard",
        }
    }

    //Función principal. Se llama cada vez que es tu turno y te da una imagen del tablero actual.
    //Devuelve Option<Coordinates>, es decir, devuelve Coordinates o None.
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        // Delegamos la lógica común a BotUtils y pasamos la estrategia según dificultad
        BotUtils::choose_move_with_strategy(board, |available_cells| {
            match &self.difficulty {
                Difficulty::Easy => self.play_easy(board, available_cells),
                Difficulty::Medium => self.play_medium(board, available_cells),
                Difficulty::Hard => self.play_hard(board, available_cells),
            }
        })
    }
}

impl OffensiveBot {

    // DIFICULTAD EASY:
    // Solo mira 1 turno al futuro. Si puede ganar, gana.
    // Si no, random, ni se molesta en mirar al rival.
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        BotUtils::find_immediate_win(board, available_cells, self.my_player_id)
            // 2. Si no, tiro random.
            .or_else(|| Some(BotUtils::to_coords(BotUtils::elegir_al_azar(available_cells), board)))
    }

    // Dificultad MEDIA:
    // Mira 2 turnos a futuro, intenta preparar una jugada para ganar en el siguiente turno.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        if let Some(m) = BotUtils::find_immediate_win(board, available_cells, self.my_player_id) {
            return Some(m);
        }

        // 2. Miramos a futuro: ¿hay alguna casilla que nos deje a un paso de ganar?
        for &casilla in available_cells.iter() {
            let coordenadas = BotUtils::to_coords(casilla, board);
            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player: self.my_player_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {
                // Si desde el futuro simulado podemos ganar en un paso, esta casilla es buena
                let casillas_futuras = tablero_simulado.available_cells();
                let gana_siguiente = casillas_futuras.iter()
                    .any(|&c| BotUtils::simulates_win(&tablero_simulado, BotUtils::to_coords(c, &tablero_simulado), self.my_player_id));

                if gana_siguiente {
                    return Some(coordenadas);
                }
            }
        }

        // 3. Si no, tiro random.
        Some(BotUtils::to_coords(BotUtils::elegir_al_azar(available_cells), board))
    }

    // DIFICULTAD DIFÍCIL:
    // Intenta crear DOS amenazas de victoria simultáneas.
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        BotUtils::find_immediate_win(board, available_cells, self.my_player_id)
            // 2. Busco una casilla que me abra 2 o más caminos de victoria (tenedor)
            .or_else(|| BotUtils::find_fork_move(board, available_cells, self.my_player_id, 2))
            // 3. Si no puedo hacer dos caminos, uso la lógica del nivel medio
            .or_else(|| self.play_medium(board, available_cells))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Coordinates, GameY, Movement, PlayerId};

    fn make_bot(difficulty: Difficulty) -> OffensiveBot {
        OffensiveBot {
            my_player_id: PlayerId::new(0),
            difficulty,
        }
    }

    // Tests de nombre
    #[test]
    fn test_offensive_easy_name() {
        let bot = make_bot(Difficulty::Easy);
        assert_eq!(bot.name(), "offensive_easy");
    }

    #[test]
    fn test_offensive_medium_name() {
        let bot = make_bot(Difficulty::Medium);
        assert_eq!(bot.name(), "offensive_medium");
    }

    #[test]
    fn test_offensive_hard_name() {
        let bot = make_bot(Difficulty::Hard);
        assert_eq!(bot.name(), "offensive_hard");
    }

    // Tests de tablero vacío y lleno
    #[test]
    fn test_easy_returns_move_on_empty_board() {
        let bot = make_bot(Difficulty::Easy);
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }

    #[test]
    fn test_medium_returns_move_on_empty_board() {
        let bot = make_bot(Difficulty::Medium);
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }

    #[test]
    fn test_hard_returns_move_on_empty_board() {
        let bot = make_bot(Difficulty::Hard);
        let game = GameY::new(5);
        assert!(bot.choose_move(&game).is_some());
    }

    #[test]
    fn test_easy_returns_none_on_full_board() {
        let bot = make_bot(Difficulty::Easy);
        let mut game = GameY::new(1);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 0, 0),
        }).unwrap();
        assert!(bot.choose_move(&game).is_none());
    }

    #[test]
    fn test_medium_returns_none_on_full_board() {
        let bot = make_bot(Difficulty::Medium);
        let mut game = GameY::new(1);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 0, 0),
        }).unwrap();
        assert!(bot.choose_move(&game).is_none());
    }

    #[test]
    fn test_hard_returns_none_on_full_board() {
        let bot = make_bot(Difficulty::Hard);
        let mut game = GameY::new(1);
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(0, 0, 0),
        }).unwrap();
        assert!(bot.choose_move(&game).is_none());
    }

    // Tests de victoria inmediata (los tres niveles deben ganar si pueden)
    #[test]
    fn test_easy_takes_immediate_win() {
        let bot = make_bot(Difficulty::Easy);
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

        let chosen = bot.choose_move(&game).unwrap();
        let idx = chosen.to_index(game.board_size());
        let win_idx = Coordinates::new(0, 2, 0).to_index(game.board_size());
        assert_eq!(idx, win_idx);
    }

    #[test]
    fn test_medium_takes_immediate_win() {
        let bot = make_bot(Difficulty::Medium);
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

        let chosen = bot.choose_move(&game).unwrap();
        let idx = chosen.to_index(game.board_size());
        let win_idx = Coordinates::new(0, 2, 0).to_index(game.board_size());
        assert_eq!(idx, win_idx);
    }

    #[test]
    fn test_hard_takes_immediate_win() {
        let bot = make_bot(Difficulty::Hard);
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

        let chosen = bot.choose_move(&game).unwrap();
        let idx = chosen.to_index(game.board_size());
        let win_idx = Coordinates::new(0, 2, 0).to_index(game.board_size());
        assert_eq!(idx, win_idx);
    }

    // Tests de movimiento válido (la casilla elegida existe en el tablero)
    #[test]
    fn test_easy_returns_valid_cell() {
        let bot = make_bot(Difficulty::Easy);
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        let idx = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&idx));
    }

    #[test]
    fn test_medium_returns_valid_cell() {
        let bot = make_bot(Difficulty::Medium);
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        let idx = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&idx));
    }

    #[test]
    fn test_hard_returns_valid_cell() {
        let bot = make_bot(Difficulty::Hard);
        let game = GameY::new(5);
        let coords = bot.choose_move(&game).unwrap();
        let idx = coords.to_index(game.board_size());
        assert!(game.available_cells().contains(&idx));
    }
}