use crate::{Coordinates, GameY, Movement, PlayerId, YBot};
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

        //Si no hay casillas vacias (tablero lleno) devolvemos None
        if available_cells.is_empty() {
            return None;
        }

        //Volvemos a mirar la dificultad con match.
        match &self.difficulty {
            Difficulty::Easy => self.play_easy(board, &available_cells),
            Difficulty::Medium => self.play_medium(board, &available_cells),
            Difficulty::Hard => self.play_hard(board, &available_cells),
        }
    }
}

impl DefensiveBot {

    // DIFICULTAD FÁCIL:
    // Si podemos ganar, ganamos. Si el rival va a ganar en el próximo turno, le bloqueamos.
    // Si no, tira al azar.
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
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

        // 3. Tiro Random
        let casilla_elegida = BotUtils::elegir_al_azar(available_cells);
        Some(BotUtils::to_coords(casilla_elegida, board))
    }

    // DIFICULTAD MEDIA:
    // Analiza el futuro. Si el rival está a punto de crear una trampa (un Tenedor), lo impide.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        let movimiento_victoria = BotUtils::find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() { return movimiento_victoria; }

        // 2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
        let movimiento_bloqueo = BotUtils::find_immediate_win(board, available_cells, self.opponent_id);
        if movimiento_bloqueo.is_some() { return movimiento_bloqueo; }

        // 3. Prevención de dobles amenazas.
        for i in 0..available_cells.len() {
            let casilla = available_cells[i];
            let coordenadas = BotUtils::to_coords(casilla, board);

            //Copiamos el tablero y simulamos que el rival pone su ficha aquí
            let mut tablero_simulado = board.clone();
            let movimiento_rival = Movement::Placement { player: self.opponent_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento_rival).is_ok() {
                let casillas_futuras = tablero_simulado.available_cells();
                let mut amenazas_rival = 0;

                // Miramos cuántos caminos ganadores se le abren al rival
                for j in 0..casillas_futuras.len() {
                    let coordenadas_futuras = BotUtils::to_coords(casillas_futuras[j], &tablero_simulado);
                    if BotUtils::simulates_win(&tablero_simulado, coordenadas_futuras, self.opponent_id) {
                        amenazas_rival += 1;
                    }
                }

                // Si esta jugada le permite al rival ganar de 2 formas, bloqueamos
                if amenazas_rival >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        // 4. Tiro Random
        let casilla_elegida = BotUtils::elegir_al_azar(available_cells);
        Some(BotUtils::to_coords(casilla_elegida, board))
    }

    // DIFÍCIL:
    // Combina el mejor ataque con la mejor defensa, primero siempre mira si puede ganar.
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {
        // 1. ¿Puedo ganar en este turno?
        let movimiento_victoria = BotUtils::find_immediate_win(board, available_cells, self.my_player_id);
        if movimiento_victoria.is_some() { return movimiento_victoria; }

        // 2. BLOQUEO: Comprobamos si el rival ganaría en su próximo turno
        let movimiento_bloqueo = BotUtils::find_immediate_win(board, available_cells, self.opponent_id);
        if movimiento_bloqueo.is_some() { return movimiento_bloqueo; }

        // 3. Lógica del ofensivo difícil: busca abrir 2 caminos ganadores propios
        for i in 0..available_cells.len() {
            let coordenadas = BotUtils::to_coords(available_cells[i], board);
            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player: self.my_player_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {
                let casillas_futuras = tablero_simulado.available_cells();
                let caminos_ganadores = casillas_futuras.iter()
                    .filter(|&&c| BotUtils::simulates_win(&tablero_simulado, BotUtils::to_coords(c, &tablero_simulado), self.my_player_id))
                    .count();

                if caminos_ganadores >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        // 4. Defensa del defensivo medio: bloquea dobles amenazas del rival
        for i in 0..available_cells.len() {
            let coordenadas = BotUtils::to_coords(available_cells[i], board);
            let mut tablero_simulado = board.clone();
            let movimiento_rival = Movement::Placement { player: self.opponent_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento_rival).is_ok() {
                let casillas_futuras = tablero_simulado.available_cells();
                let amenazas_rival = casillas_futuras.iter()
                    .filter(|&&c| BotUtils::simulates_win(&tablero_simulado, BotUtils::to_coords(c, &tablero_simulado), self.opponent_id))
                    .count();

                if amenazas_rival >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        // 5. Random
        let casilla_elegida = BotUtils::elegir_al_azar(available_cells);
        Some(BotUtils::to_coords(casilla_elegida, board))
    }
}
