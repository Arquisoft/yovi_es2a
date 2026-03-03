// Sobre el flujo desde React:
//1. React arranca → POST /v1/game
//                   El servidor crea un GameY, le asigna un ID único (uuid)
//                   y lo guarda en el HashMap de AppState.
//                   Devuelve el estado inicial del tablero.
//
//2. El jugador mueve → POST /v1/game/{id}/move
//                      El servidor busca la partida por ID en el HashMap,
//                      aplica el movimiento, y si hay bot, lo hace jugar.
//                      Devuelve el tablero actualizado.
//
//3. React consulta → GET /v1/game/{id}
//                    El servidor busca la partida y devuelve su estado actual.

// Poner una url que varíe el host para el despliegue
const BACKEND_URL = "http://localhost:4000";

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

// ─── Llamadas HTTP ─────────────────────────────────────────────────────────

// Llamada que crea el juego
export async function createGame(
    // De momento los datos pasados son default, pero se podrían personalizar desde la UI
    size: number,
    mode: "human" | "computer" = "human",
    bot: string = "random_bot"
): Promise<ApiGameState> {
    const response = await fetch(`${BACKEND_URL}/v1/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, mode, bot }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Error al crear la partida");
    }
    return response.json();
}

// Obtiene el estado de la partida por su ID
export async function getGame(gameId: string): Promise<ApiGameState> {
    const response = await fetch(`${BACKEND_URL}/v1/game/${gameId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Partida no encontrada");
    }
    return response.json();
}

// Hace un movimiento en la partida
export async function placeToken(
    gameId: string,
    player: number,
    cellIndex: number,
    botId?: string
): Promise<ApiMakeMoveResponse> {
    const body: Record<string, unknown> = {
        player,
        action: "place",
        cell_index: cellIndex,
    };
    if (botId) body.bot = botId;

    const response = await fetch(`${BACKEND_URL}/v1/game/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Movimiento inválido");
    }
    return response.json();
}

export async function resign(
    gameId: string,
    player: number
): Promise<ApiMakeMoveResponse> {
    const response = await fetch(`${BACKEND_URL}/v1/game/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, action: "resign" }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Error al rendirse");
    }
    return response.json();
}
