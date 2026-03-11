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
