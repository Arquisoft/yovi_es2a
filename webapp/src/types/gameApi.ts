// ─── Tipos que devuelve la API ─────────────────────────────────────────────

// Celda devuelta por la API
export interface ApiCell {
    index: number;
    coords: [number, number, number]; // [x, y, z]
    player: number | null;            // 0, 1, o null
}

// Estado completo del juego devuelto por la API
export interface ApiGameState {
    game_id: string;
    board_size: number;
    total_cells: number;
    cells: ApiCell[];
    available_cells: number[];
    status: "ongoing" | "finished";
    next_player: number | null;
    winner: number | null;
}

// Respuesta de la API al hacer un movimiento
export interface ApiMakeMoveResponse {
    applied_move: {
        player: number;
        action: string;
        cell_index: number | null;
    };
    bot_move: {
        player: number;
        action: string;
        cell_index: number | null;
    } | null;
    game_state: ApiGameState;
}