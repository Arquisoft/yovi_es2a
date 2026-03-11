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
        //Miramos la self.difficulty con & para mirar el valor sin adueñarnos de el en la memoria.
        match &self.difficulty {
            // Dependiendo de la dificultad, devolvemos uno u otro.
            Difficulty::Easy => "offensive_easy",
            Difficulty::Medium => "offensive_medium",
            Difficulty::Hard => "offensive_hard",
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

impl OffensiveBot {

    // DIFICULTAD EASY:
    // Solo mira 1 turno al futuro. Si puede ganar, gana.
    // Si no, random, ni se molesta en mirar al rival.
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. Miro si con alguna casilla ya puedo ganar
        let movimiento_victoria = BotUtils::find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        // 2. Si no, tiro random.
        let casilla_elegida = BotUtils::elegir_al_azar(available_cells);
        Some(BotUtils::to_coords(casilla_elegida, board))
    }

    // Dificultad MEDIA:
    // Mira 2 turnos a futuro, intenta preparar una jugada para ganar en el siguiente turno.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. Miro si con alguna casilla ya puedo ganar
        let movimiento_victoria = BotUtils::find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        // 2. Miramos a futuro: ¿hay alguna casilla que nos deje a un paso de ganar?
        for i in 0..available_cells.len() {
            let coordenadas = BotUtils::to_coords(available_cells[i], board);

            //Creo una copia del tablero y ponemos nuestra ficha en la casilla que sea
            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player: self.my_player_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {
                // Miramos las casillas que quedan libres en el futuro simulado
                let casillas_futuras = tablero_simulado.available_cells();

                // Si desde el futuro simulado podemos ganar en un paso, esta casilla es buena
                let gana_siguiente = casillas_futuras.iter()
                    .any(|&c| BotUtils::simulates_win(&tablero_simulado, BotUtils::to_coords(c, &tablero_simulado), self.my_player_id));

                if gana_siguiente {
                    return Some(coordenadas);
                }
            }
        }

        // 3. Si no, tiro random.
        let casilla_elegida = BotUtils::elegir_al_azar(available_cells);
        Some(BotUtils::to_coords(casilla_elegida, board))
    }

    // DIFICULTAD DIFÍCIL:
    // Intenta crear DOS amenazas de victoria simultáneas.
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. Miro si con alguna casilla ya puedo ganar
        let movimiento_victoria = BotUtils::find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() {
            return movimiento_victoria;
        }

        // 2. Busco una casilla que me abra 2 o más caminos de victoria
        for i in 0..available_cells.len() {
            let coordenadas = BotUtils::to_coords(available_cells[i], board);
            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player: self.my_player_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {
                // Contamos cuántos movimientos ganadores nos quedan disponibles
                let casillas_futuras = tablero_simulado.available_cells();
                let caminos_ganadores = casillas_futuras.iter()
                    .filter(|&&c| BotUtils::simulates_win(&tablero_simulado, BotUtils::to_coords(c, &tablero_simulado), self.my_player_id))
                    .count();

                // Si hay 2 o más caminos, el rival no puede taparlos todos
                if caminos_ganadores >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        // 3. Si no puedo hacer dos caminos, uso la lógica del nivel medio
        self.play_medium(board, available_cells)
    }
}
