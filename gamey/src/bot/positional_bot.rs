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
        //Miramos la self.difficulty con & para mirar el valor sin adueñarnos de el en la memoria.
        match &self.difficulty {
            // Dependiendo de la dificultad, devolvemos uno u otro.
            Difficulty::Easy => "positional_easy",
            Difficulty::Medium => "positional_medium",
            Difficulty::Hard => "positional_hard",
        }
    }

    //Función principal. Se llama cada vez que es tu turno y te da una imagen del tablero actual.
    //Devuelve Option<Coordinates>, es decir, devuelve Coordinates o None.
    fn choose_move(&self, board: &GameY) -> Option<Coordinates> {
        //Le pedimos a board que nos de un vector con los índices de las casillas vacias.
        let available_cells = board.available_cells();

        //Si no hay casillas vacias (tablero lleno) devolvemos None
        if available_cells.is_empty() {
            return None;
        }

        match &self.difficulty {
            Difficulty::Easy => self.play_easy(board, &available_cells),
            Difficulty::Medium => self.play_medium(board, &available_cells),
            Difficulty::Hard => self.play_hard(board, &available_cells),
        }
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
        let movimiento_victoria = BotUtils::find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        // 2. Si no, dominamos el centro
        self.get_best_central_move(board, available_cells)
    }

    // DIFÍCIL: Prioriza ganar o bloquear al rival, y sino, al centro
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        let movimiento_victoria = BotUtils::find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        // 2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
        let movimiento_bloqueo = BotUtils::find_immediate_win(board, available_cells, self.opponent_id);
        if movimiento_bloqueo.is_some() {
            return movimiento_bloqueo;
        }

        // 3. Si nada, al centro
        self.get_best_central_move(board, available_cells)
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
