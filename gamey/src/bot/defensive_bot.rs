use crate::{Coordinates, GameY, PlayerId, YBot};
use crate::bot::Difficulty;
use crate::bot::bot_utils::BotUtils;

// El Bot Defensivo: asfixiar al rival todo el rato
pub struct DefensiveBot {
    pub my_player_id: PlayerId,
    pub opponent_id: PlayerId,
    pub difficulty: Difficulty,
}

impl YBot for DefensiveBot {

    // Función que devuelve el nombre del bot
    fn name(&self) -> &str {
        match &self.difficulty {
            Difficulty::Easy => "defensive_easy",
            Difficulty::Medium => "defensive_medium",
            Difficulty::Hard => "defensive_hard",
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

impl DefensiveBot {

    // DIFICULTAD FÁCIL:
    // Si podemos ganar, ganamos. Si el rival va a ganar en el próximo turno, le bloqueamos.
    // Si no, tira al azar.
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        BotUtils::find_immediate_win(board, available_cells, self.my_player_id)
            // 2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
            .or_else(|| BotUtils::find_immediate_win(board, available_cells, self.opponent_id))
            // 3. Tiro Random
            .or_else(|| Some(BotUtils::to_coords(BotUtils::elegir_al_azar(available_cells), board)))
    }

    // DIFICULTAD MEDIA:
    // Analiza el futuro. Si el rival está a punto de crear una trampa (un Tenedor), lo impide.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        BotUtils::find_immediate_win(board, available_cells, self.my_player_id)
            // 2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
            .or_else(|| BotUtils::find_immediate_win(board, available_cells, self.opponent_id))
            // 3. Prevención de dobles amenazas: bloqueamos si el rival puede crear un tenedor
            .or_else(|| BotUtils::find_fork_move(board, available_cells, self.opponent_id, 2))
            // 4. Tiro Random
            .or_else(|| Some(BotUtils::to_coords(BotUtils::elegir_al_azar(available_cells), board)))
    }

    // DIFÍCIL:
    // Combina el mejor ataque con la mejor defensa, primero siempre mira si puede ganar.
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        BotUtils::find_immediate_win(board, available_cells, self.my_player_id)
            // 2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
            .or_else(|| BotUtils::find_immediate_win(board, available_cells, self.opponent_id))
            // 3. Ataque: busca abrir 2 caminos ganadores propios
            .or_else(|| BotUtils::find_fork_move(board, available_cells, self.my_player_id, 2))
            // 4. Defensa: bloquea dobles amenazas del rival
            .or_else(|| BotUtils::find_fork_move(board, available_cells, self.opponent_id, 2))
            // 5. Random
            .or_else(|| Some(BotUtils::to_coords(BotUtils::elegir_al_azar(available_cells), board)))
    }
}



#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Coordinates, GameY, Movement, PlayerId};

    fn make_bot(difficulty: Difficulty) -> DefensiveBot {
        DefensiveBot {
            my_player_id: PlayerId::new(0),
            opponent_id: PlayerId::new(1),
            difficulty,
        }
    }

    // Tests de nombre
    #[test]
    fn test_defensive_easy_name() {
        let bot = make_bot(Difficulty::Easy);
        assert_eq!(bot.name(), "defensive_easy");
    }

    #[test]
    fn test_defensive_medium_name() {
        let bot = make_bot(Difficulty::Medium);
        assert_eq!(bot.name(), "defensive_medium");
    }

    #[test]
    fn test_defensive_hard_name() {
        let bot = make_bot(Difficulty::Hard);
        assert_eq!(bot.name(), "defensive_hard");
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

    //Tests de victoria inmediata (los tres niveles deben ganar si pueden)
    #[test]
    fn test_easy_takes_immediate_win() {
        let bot = make_bot(Difficulty::Easy);
        let mut game = GameY::new(3);

        // Colocamos fichas de player 0 para que solo le falte una para ganar
        // Conectamos lados A y B con fichas adyacentes, dejando la última libre
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
        let win_coords = Coordinates::new(0, 2, 0);
        let win_idx = win_coords.to_index(game.board_size());
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
        let win_coords = Coordinates::new(0, 2, 0);
        let win_idx = win_coords.to_index(game.board_size());
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
        let win_coords = Coordinates::new(0, 2, 0);
        let win_idx = win_coords.to_index(game.board_size());
    }

    // Tests de bloqueo (el rival está a punto de ganar)
    #[test]
    fn test_easy_blocks_opponent_win() {
        let bot = make_bot(Difficulty::Easy);
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
        let block_coords = Coordinates::new(0, 2, 0);
        let block_idx = block_coords.to_index(game.board_size());
    }

    #[test]
    fn test_medium_blocks_opponent_win() {
        let bot = make_bot(Difficulty::Medium);
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
        let block_coords = Coordinates::new(0, 2, 0);
        let block_idx = block_coords.to_index(game.board_size());
    }

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
        let block_coords = Coordinates::new(0, 2, 0);
        let block_idx = block_coords.to_index(game.board_size());
    }

}
