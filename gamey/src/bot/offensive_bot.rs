use crate::{Coordinates, GameStatus, GameY, Movement, PlayerId, YBot};

//Niveles de dificultad disponibles
pub enum Difficulty {
    Easy,
    Medium,
    Hard,
}

//El Bot Ofensivo: solo quiere conectar los 3 lados ignorando al rival.
pub struct OffensiveBot {   //El nombre que pongamos aqui es importante para cli.rs
    pub my_player_id: PlayerId,
    pub difficulty: Difficulty,
}


impl YBot for OffensiveBot {

    //Funcion que devuelve el nombre del bot.
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
impl OffensiveBot {

    //DIFICULTAD EASY: 
    //Solo mira 1 turno al futuro. Si puede ganar, gana. 
    //Si no, random, ni se molesta en mirar al rival.
    //Recibe board, y lista de casillas disponibles, puede devolver Coordinates o nada
    fn play_easy(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {

        //1. Miro si con alguna casilla ya puedo ganar 
        for i in 0..available_cells.len() {

            //Saco la casilla de ese indice
            let casilla = available_cells[i];

            //Pasa el numero de la casilla a coordenadas con to_coords
            //Luego pregunta a simulates_win si con esa ficha ahi ya se gana, si si, devuelve esas coordenadas
            if self.simulates_win(board, self.to_coords(casilla, board)) {
                return Some(self.to_coords(casilla, board));
            }
        }

        //2. Si no, tiro random.
        //Num random entre 0 y el numero de casillas disponibles
        let posicion_azar   = rand::random_range(0..available_cells.len());
        //Con el numero saco la casilla a pintar
        let casilla_elegida = available_cells[posicion_azar];

        //Paso la casilla a cordenadas sin return, porque al no poner ";" ya detecta Rust que es return
        Some(self.to_coords(casilla_elegida, board))
    }


    //Dificultad MEDIA:
    //Mira 2 turnos a futuro, intenta preparar una jugada para ganar en el siguiente turno.
    fn play_medium(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {

        //1. Miro si con alguna casilla ya puedo ganar (como en facil)
        for i in 0..available_cells.len() {

            //Saco la casilla de ese indice
            let casilla = available_cells[i];

            //Pasa el numero de la casilla a coordenadas con to_coords
            //Luego pregunta a simulates_win si con esa ficha ahi ya se gana, si si, devuelve esas coordenadas
            if self.simulates_win(board, self.to_coords(casilla, board)) {
                return Some(self.to_coords(casilla, board));
            }
        }

        //2. Miramos a futuro, probamos a poner cada ficha disponible en un hueco vacio
        // ¿Hay alguna casilla que nos deje a un paso de ganar?
        for i in 0..available_cells.len() {
            let casilla    = available_cells[i];
            let coordenadas = self.to_coords(casilla, board);

            //Creo una copia del tablero y ponemos nuestra ficha en la casilla que sea
            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player: self.my_player_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {

                // Miramos las casillas que quedan libres en el futuro simulado
                let casillas_futuras = tablero_simulado.available_cells();

                //Recorremos cada casilla futura y miramos si ya se ganaría
                for j in 0..casillas_futuras.len() {
                    let casilla_futura      = casillas_futuras[j];
                    let coordenadas_futuras = self.to_coords(casilla_futura, &tablero_simulado);

                    //Si si, significa que available_cells[i] nos deja a un movimiento de ganar
                    if self.simulates_win(&tablero_simulado, coordenadas_futuras) {
                        return Some(coordenadas); //Devolver la casilla del turno actual
                    }
                }
                }
            }

        //3. Si no, tiro random.
        //Num random entre 0 y el numero de casillas disponibles
        let posicion_azar   = rand::random_range(0..available_cells.len());
        //Con el numero saco la casilla a pintar
        let casilla_elegida = available_cells[posicion_azar];

        //Paso la casilla a cordenadas sin return, porque al no poner ";" ya detecta Rust que es return
        Some(self.to_coords(casilla_elegida, board))
    }

    //DIFICULTAD DIFÍCIL: 
    //Intenta crear DOS amenazas de victoria simultáneas.
    fn play_hard(&self, board: &GameY, available_cells: &Vec<u32>) -> Option<Coordinates> {

        //1. Miro si con alguna casilla ya puedo ganar (como en facil)
        for i in 0..available_cells.len() {

            //Saco la casilla de ese indice
            let casilla = available_cells[i];

            //Pasa el numero de la casilla a coordenadas con to_coords
            //Luego pregunta a simulates_win si con esa ficha ahi ya se gana, si si, devuelve esas coordenadas
            if self.simulates_win(board, self.to_coords(casilla, board)) {
                return Some(self.to_coords(casilla, board));
            }
        }


        //2. Busco una casilla que me abra 2 o mas caminos de victoria
        for i in 0..available_cells.len() {
            let casilla     = available_cells[i];
            let coordenadas = self.to_coords(casilla, board);

            //Creo una copia del tablero y ponemos nuestra ficha en la casilla que sea
            let mut tablero_simulado = board.clone();
            let movimiento = Movement::Placement { player: self.my_player_id, coords: coordenadas };

            if tablero_simulado.add_move(movimiento).is_ok() {

                // Contamos cuántos movimientos ganadores nos quedan disponibles e inicializamos caminos ganadores
                let casillas_futuras  = tablero_simulado.available_cells();
                let mut caminos_ganadores = 0;

                //Recorremos cada casilla futura y miramos si ya se ganaría
                for j in 0..casillas_futuras.len() {
                    let casilla_futura      = casillas_futuras[j];
                    let coordenadas_futuras = self.to_coords(casilla_futura, &tablero_simulado);

                    //Si si, significa que available_cells[i] nos deja a un movimiento de ganar
                    //Por tanto, caminos ganadores+1
                    if self.simulates_win(&tablero_simulado, coordenadas_futuras) {
                        caminos_ganadores += 1;
                    }
                }

                // Si hay 2 o más caminos, el rival no puede taparlos todos
                if caminos_ganadores >= 2 {
                    return Some(coordenadas);
                }
            }
        }

        // 3. Si no puedo hacer dos caminos, uso la lógica del nivel medio
        let movimiento_medio = self.play_medium(board, available_cells);
        if movimiento_medio.is_some() {
            return movimiento_medio;
        }

        //4. Si no, tiro random.
        //Num random entre 0 y el numero de casillas disponibles
        let posicion_azar   = rand::random_range(0..available_cells.len());
        //Con el numero saco la casilla a pintar
        let casilla_elegida = available_cells[posicion_azar];

        //Paso la casilla a cordenadas sin return, porque al no poner ";" ya detecta Rust que es return
        Some(self.to_coords(casilla_elegida, board))
    }
    
    // Función auxiliar, recible tablero y unas coordenadas
    fn simulates_win(&self, board: &GameY, coords: Coordinates) -> bool {
        //Creamos una copia del tablero
        let mut tablero_simulado = board.clone();

        //Esto es como crear un new Movement (jugador, coordenadas)
        let movimiento  = Movement::Placement { 
            player: self.my_player_id, 
            coords 
        };
        
        //Si el movimeinto es OK
        if tablero_simulado.add_move(movimiento).is_ok() {

            // Miramos el estado del tablero tras el movimiento
            let estado = tablero_simulado.status();

            // Si la partida ha terminado, comprobamos si ganamos nosotros
            match estado {
                GameStatus::Finished { winner } => return *winner == self.my_player_id,
                _ => return false, // La partida no ha terminado todavía
            }
        }
        //Si el movimiento no es OK
        false
    }

    //Recibe un numero de casilla (cell) y el tablero (board) y devuelve Coordinates
    fn to_coords(&self, cell: u32, board: &GameY) -> Coordinates {
        //Llama a from_index con el numero de la casilla y el tamaño del tablero
        //Lo pasa a coordenadas y lo devuelve.
        Coordinates::from_index(cell, board.board_size())
    }
}