// Esta clase contiene todas las conexiones entre la API de rust y la lógica del juego en React.

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

// Importamos los tipos de la API
import type { ApiGameState, ApiMakeMoveResponse } from "../types/gameApi";

// Si está vacío usamos localHost, en otro caso funciona con la ip. Debería funcionar en el despliegue
const BACKEND_URL = "http://localhost:4000";


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
        // Añade al JSON tamaño, moodo y bot usando stringify para convertirlo a texto
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
    // Llamamos a la API de rust y le pedimos que nos devuelva el estado de la partida con ese ID
    const response = await fetch(`${BACKEND_URL}/v1/game/${gameId}`);
    // Si sale mal obtenemos el error y lo mostramos
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Partida no encontrada");
    }
    // En cualquier otro caso obtenemos el Json (YEN)
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

// Método para que un jugador se rinda en una partida
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
