use crate::{Coordinates, GameY, PlayerId, YBot};
use crate::bot::Difficulty;
use crate::bot::bot_utils::BotUtils;

// El Bot Posicional: siempre quiere el centro
pub struct PositionalBot {
    pub my_player_id: PlayerId,
    pub opponent_id: PlayerId,
    pub difficulty: Difficulty,
}

impl YBot for PositionalBot {

    // Función que devuelve el nombre del bot
    fn name(&self) -> &str {
        match &self.difficulty {
            Difficulty::Easy => "positional_easy",
            Difficulty::Medium => "positional_medium",
            Difficulty::Hard => "positional_hard",
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

impl PositionalBot {

    // FÁCIL: Elige la casilla disponible más cercana al centro exacto del tablero.
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        self.get_best_central_move(board, available_cells)
    }

    // MEDIO: Si puede ganar, gana. Si no, busca el centro.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar ya este turno?
        BotUtils::find_immediate_win(board, available_cells, self.my_player_id)
            // 2. Si no, dominamos el centro
            .or_else(|| self.get_best_central_move(board, available_cells))
    }

    // DIFÍCIL: Prioriza ganar o bloquear al rival, y sino, al centro
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        BotUtils::find_immediate_win(board, available_cells, self.my_player_id)
            // 2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
            .or_else(|| BotUtils::find_immediate_win(board, available_cells, self.opponent_id))
            // 3. Si nada, al centro
            .or_else(|| self.get_best_central_move(board, available_cells))
    }

    // Elige la casilla disponible más cercana al centro geométrico del tablero
    fn get_best_central_move(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        let size = board.board_size() as f32;
        let centro = (size / 3.0, size / 3.0, size / 3.0);

        available_cells.iter()
            .map(|&c| BotUtils::to_coords(c, board))
            .min_by(|a, b| {
                let da = self.distance_to_center(*a, centro);
                let db = self.distance_to_center(*b, centro);
                da.partial_cmp(&db).unwrap()
            })
    }

    // Calcula la distancia euclidea entre unas coordenadas y el centro objetivo
    fn distance_to_center(&self, coords: Coordinates, target: (f32, f32, f32)) -> f32 {
        let (x, y, z) = (coords.x() as f32, coords.y() as f32, coords.z() as f32);
        ((x - target.0).powi(2) + (y - target.1).powi(2) + (z - target.2).powi(2)).sqrt()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Coordinates, GameY, Movement, PlayerId};

    fn make_bot(difficulty: Difficulty) -> PositionalBot {
        PositionalBot {
            my_player_id: PlayerId::new(0),
            opponent_id: PlayerId::new(1),
            difficulty,
        }
    }

    // Tests de nombre
    #[test]
    fn test_positional_easy_name() {
        let bot = make_bot(Difficulty::Easy);
        assert_eq!(bot.name(), "positional_easy");
    }

    #[test]
    fn test_positional_medium_name() {
        let bot = make_bot(Difficulty::Medium);
        assert_eq!(bot.name(), "positional_medium");
    }

    #[test]
    fn test_positional_hard_name() {
        let bot = make_bot(Difficulty::Hard);
        assert_eq!(bot.name(), "positional_hard");
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
        assert!(game.available_cells().contains(&idx));
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

    // Tests de bloqueo (el rival está a punto de ganar)
    #[test]
    fn test_hard_blocks_opponent_win() {
        let bot = make_bot(Difficulty::Hard);
        let mut game = GameY::new(3);

        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 0, 2),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(2, 0, 0),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(1),
            coords: Coordinates::new(0, 1, 1),
        }).unwrap();
        game.add_move(Movement::Placement {
            player: PlayerId::new(0),
            coords: Coordinates::new(1, 1, 0),
        }).unwrap();

        let chosen = bot.choose_move(&game).unwrap();
        let idx = chosen.to_index(game.board_size());
        let block_idx = Coordinates::new(0, 2, 0).to_index(game.board_size());
        assert_eq!(idx, block_idx);
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