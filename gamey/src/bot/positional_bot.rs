use crate::{Coordinates, GameY, Movement, PlayerId, YBot, GameStatus};
use crate::bot::Difficulty;


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
        
        //Si no hay casillsa vacias(tablero lleno) devolvemos None
        if available_cells.is_empty() {
            return None;
        }

        //Volvemos a mirar la dificultad con match.
        match &self.difficulty {
            //Si es facil, manda el tablero y las casillas a la play_easy 
            Difficulty::Easy => self.play_easy(board, &available_cells),
            //Si es medio, manda el tablero y las casillas a la play_medium
            Difficulty::Medium => self.play_medium(board, &available_cells),
            //Si es dificil, manda el tablero y las casillas a la play_hard
            Difficulty::Hard => self.play_hard(board, &available_cells),
        }
    }
}

impl PositionalBot {
    //FÁCIL: Elige la casilla disponible más cercana al centro exacto del tablero.
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        self.get_best_central_move(board, available_cells)
    }

    //MEDIO: Si puede ganar, gana. Si no, busca el centro.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar ya este turno?
        let movimiento_victoria = self.find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        // 2. Si no, dominamos el centro
        self.get_best_central_move(board, available_cells)
    }

    // DIFÍCIL: Prioriza ganar o bloquear al rival, y sino, al centro
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {

        //Puedo ganar en este turno?
        let movimiento_victoria = self.find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        //2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
        let movimiento_bloqueo = self.find_immediate_win(board, available_cells, self.opponent_id);
        if movimiento_bloqueo.is_some() {
            return movimiento_bloqueo;
        }

        //3. Si nada, al centro
        self.get_best_central_move(board, available_cells)
    }

    fn get_best_central_move(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        let size   = board.board_size() as f32;
        let centro = (size / 3.0, size / 3.0, size / 3.0);

        let mut mejor_coords    = None;
        let mut mejor_distancia = f32::MAX; 

        for i in 0..available_cells.len() {
            let casilla     = available_cells[i];
            let coordenadas = self.to_coords(casilla, board);
            let distancia   = self.distance_to_center(coordenadas, centro);

            if distancia < mejor_distancia {
                mejor_distancia = distancia;
                mejor_coords    = Some(coordenadas);
            }
        }

        mejor_coords
    }

    fn distance_to_center(&self, coords: Coordinates, target: (f32, f32, f32)) -> f32 {
        let (x, y, z) = (coords.x() as f32, coords.y() as f32, coords.z() as f32);
        ((x - target.0).powi(2) + (y - target.1).powi(2) + (z - target.2).powi(2)).sqrt()
    }

    fn find_immediate_win(&self, board: &GameY, available_cells: &Vec<u32>, player: PlayerId) -> Option<Coordinates> {
        for i in 0..available_cells.len() {
            let casilla     = available_cells[i];
            let coordenadas = self.to_coords(casilla, board);

            if self.simulates_win(board, coordenadas, player) {
                return Some(coordenadas);
            }
        }
        None
    }

    // Comprueba si poniendo una ficha en coords el jugador indicado ganaría
    fn simulates_win(&self, board: &GameY, coords: Coordinates, player: PlayerId) -> bool {
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

    // Recibe un número de casilla y el tablero, devuelve sus Coordinates
    fn to_coords(&self, cell: u32, board: &GameY) -> Coordinates {
        Coordinates::from_index(cell, board.board_size())
    }
}