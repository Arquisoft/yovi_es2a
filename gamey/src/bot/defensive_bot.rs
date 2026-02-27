use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};
use crate::bot::Difficulty;

// El Bot Defensivo: asxifiar al rival todo el rato
pub struct DefensiveBot {
    pub my_player_id: PlayerId,
    pub opponent_id: PlayerId, 
    pub difficulty: Difficulty,
}

impl YBot for DefensiveBot {
    
    // Función que devuelve el nombre del bot
    fn name(&self) -> &str {

        //Miramos la self.difficulty con & para mirar el valor sin adueñarnos de el en la memoria.
        match &self.difficulty {
            // Dependiendo de la dificultad, devolvemos uno u otro.
            Difficulty::Easy => "defensive_easy",
            Difficulty::Medium => "defensive_medium",
            Difficulty::Hard => "defensive_hard",
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

//La logica para cada dificultad
impl DefensiveBot {
    
    // DIFICULTAD FÁCIL: 
    // Si podemos ganar, ganamos. Si el rival va a ganar en el próximo turno, le bloqueamos. 
    // Si no, tira al azar.
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        
        //Puedo ganar en este turno?
        //Find_inmediate_win prueba todas las casillas con nuestro ID para ver si podemos ganar
        let movimiento_victoria = self.find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        //2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
        let movimiento_bloqueo = self.find_immediate_win(board, available_cells, self.opponent_id);
        if movimiento_bloqueo.is_some() {
            return movimiento_bloqueo;
        }

        //3. Tiro Random
        let casilla_elegida = self.elegir_al_azar(available_cells);
        Some(self.to_coords(casilla_elegida, board))
    }

    // DIFICULTAD MEDIA: 
    // Analiza el futuro. Si el rival está a punto de crear una trampa (un Tenedor), lo impide.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        
        //Puedo ganar en este turno?
        let movimiento_victoria = self.find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() { return movimiento_victoria; }

         //2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
        let movimiento_bloqueo = self.find_immediate_win(board, available_cells, self.opponent_id);
        if movimiento_bloqueo.is_some() { return movimiento_bloqueo; }

        //3. Prevencion de dobles amenazas.
        for i in 0..available_cells.len() {
            let casilla = available_cells[i];
            let coordenadas = self.to_coords(casilla, board);
            
            //Copiamos el tablero y simulamos que el rival pone su ficha aquí
            let mut tablero_simulado = board.clone();
            let movimiento_rival = Movement::Placement { player: self.opponent_id, coords: coordenadas };
            
            if tablero_simulado.add_move(movimiento_rival).is_ok() {
                
                let casillas_futuras = tablero_simulado.available_cells();
                let mut amenazas_rival = 0;
                
                // Miramos cuántos caminos ganadores se le abren al rival
                for j in 0..casillas_futuras.len() {
                    let casilla_futura = casillas_futuras[j];
                    let coordenadas_futuras = self.to_coords(casilla_futura, &tablero_simulado);
                    
                    if self.simulates_win(&tablero_simulado, coordenadas_futuras, self.opponent_id) {
                        amenazas_rival += 1;
                    }
                }

                // Si esta jugada le permite al rival ganar de 2 formas, bloqueamos
                if amenazas_rival >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        //4. Tiro Random
        let casilla_elegida = self.elegir_al_azar(available_cells);
        Some(self.to_coords(casilla_elegida, board))
    }

    //DIFICIL
    //COMBINA el mejor ataque con la mejor defensa, primero siempre mira si puede ganar.
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {

        //Puedo ganar en este turno?
        let movimiento_victoria = self.find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() { return movimiento_victoria; }

        //2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
        let movimiento_bloqueo = self.find_immediate_win(board, available_cells, self.opponent_id);
        if movimiento_bloqueo.is_some() { return movimiento_bloqueo; }

        //3. Logica del ofensivo dificil
        for i in 0..available_cells.len() {
            let casilla     = available_cells[i];
            let coordenadas = self.to_coords(casilla, board);

            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player: self.my_player_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {

                let casillas_futuras      = tablero_simulado.available_cells();
                let mut caminos_ganadores = 0;

                for j in 0..casillas_futuras.len() {
                    let casilla_futura      = casillas_futuras[j];
                    let coordenadas_futuras = self.to_coords(casilla_futura, &tablero_simulado);

                    if self.simulates_win(&tablero_simulado, coordenadas_futuras, self.my_player_id) {
                        caminos_ganadores += 1;
                    }
                }

                if caminos_ganadores >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        //4. Defensa del defensivo medio
        for i in 0..available_cells.len() {
            let casilla     = available_cells[i];
            let coordenadas = self.to_coords(casilla, board);

            let mut tablero_simulado = board.clone();
            let movimiento_rival = Movement::Placement { player: self.opponent_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento_rival).is_ok() {

                let casillas_futuras   = tablero_simulado.available_cells();
                let mut amenazas_rival = 0;

                for j in 0..casillas_futuras.len() {
                    let casilla_futura      = casillas_futuras[j];
                    let coordenadas_futuras = self.to_coords(casilla_futura, &tablero_simulado);

                    if self.simulates_win(&tablero_simulado, coordenadas_futuras, self.opponent_id) {
                        amenazas_rival += 1;
                    }
                }

                if amenazas_rival >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        //5. Random
        let casilla_elegida = self.elegir_al_azar(available_cells);
        Some(self.to_coords(casilla_elegida, board))
    }

    // Busca si alguna casilla disponible da la victoria inmediata al jugador pasado por parametro
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

    //Recibe un numero de casilla (cell) y el tablero (board) y devuelve Coordinates
    fn to_coords(&self, cell: u32, board: &GameY) -> Coordinates {
        //Llama a from_index con el numero de la casilla y el tamaño del tablero
        //Lo pasa a coordenadas y lo devuelve.
        Coordinates::from_index(cell, board.board_size())
    }

    // Devuelve una casilla aleatoria limpia
    fn elegir_al_azar(&self, casillas: &Vec<u32>) -> u32 {
        let posicion_azar = rand::random_range(0..casillas.len());
        casillas[posicion_azar]
    }
}