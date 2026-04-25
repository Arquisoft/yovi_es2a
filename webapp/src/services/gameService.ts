// Esta clase contiene todas las conexiones entre la API de rust y la lógica del juego en React.

// Sobre el flujo desde React:
//1. React arranca → POST /game/new
//                   El servidor crea un GameY, le asigna un ID único (uuid)
//                   y lo guarda en el HashMap de AppState.
//                   Devuelve el estado inicial del tablero.
//
//2. El jugador mueve → POST /game/{id}/move
//                      El servidor busca la partida por ID en el HashMap,
//                      aplica el movimiento, y si hay bot, lo hace jugar.
//                      Devuelve el tablero actualizado.
//
//3. React consulta → GET /game/{id}
//                    El servidor busca la partida y devuelve su estado actual.

// Importamos los tipos de la API
import type { ApiGameState, ApiMakeMoveResponse } from "../types/gameApi";

// Si está vacío usamos localHost, en otro caso funciona con la ip. Debería funcionar en el despliegue
const BACKEND_URL = import.meta.env.VITE_GAMEY_URL ?? "http://localhost:4000";

const USERS_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";


// Llamada que crea el juego
export async function createGame(
    // De momento los datos pasados son default, pero se podrían personalizar desde la UI
    size: number,
    mode: "human" | "computer" = "human",
    bot: string = "random_bot",
    timer?: number | null,
): Promise<ApiGameState> {
    const response = await fetch(`${BACKEND_URL}/game/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Añade al JSON tamaño, moodo y bot usando stringify para convertirlo a texto
        body: JSON.stringify({ size, mode, bot, timer }),
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
    const safeId = encodeURIComponent(gameId);
    const response = await fetch(`${BACKEND_URL}/game/${safeId}`);
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

    const url = new URL(`/game/${encodeURIComponent(gameId)}/move`, BACKEND_URL);
    const response = await fetch(url.toString(), {
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
    // Validamos estrictamente el formato del ID antes de usarlo
    if (!/^[a-zA-Z0-9-]+$/.test(gameId)) {
        throw new Error("Formato de ID de partida inválido por seguridad");
    }
    const response = await fetch(`${BACKEND_URL}/game/${gameId}/move`, {
        method: 'POST',
        // ... resto del código igual
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, action: "resign" }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Error al rendirse");
    }
    return response.json();
}

export async function timeout(
    gameId: string,
    player: number,
    botId?: string
): Promise<ApiMakeMoveResponse> {
    const body: Record<string, unknown> = {
        player,
        action: "timeout",
        cell_index: null,
    };

    // Si hay un bot jugando, le decimos a Rust que el bot juegue su turno automáticamente después
    if (botId) body.bot = botId;

    const cleanId = gameId.replace(/[./\\]/g, ''); 
    const response = await fetch(`${BACKEND_URL}/game/${cleanId}/move`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Error al pasar turno");
    }
    return response.json();
}

// Guarda el resultado de una partida finalizada en el historial del usuario.
// resultado: '1' = gana el usuario logueado, '2' = pierde
export async function saveGameResult(
    username: string,
    rival: string,
    resultado: "1" | "2",
    size: number,
): Promise<void> {
    const response = await fetch(`${USERS_URL}/savegame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, rival, resultado, size }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Error al guardar la partida");
    }
}

// Devuelve el historial de partidas de un usuario con filtros opcionales
export async function getHistory(
    username: string,
    filters: HistoryFilters = {}
): Promise<GameHistoryRecord[]> {
    const params = new URLSearchParams();
    if (filters.resultado)          params.set("resultado", filters.resultado);
    if (filters.rival?.trim())      params.set("rival", filters.rival.trim());
    if (filters.fechaDesde)         params.set("fechaDesde", filters.fechaDesde);
    if (filters.fechaHasta)         params.set("fechaHasta", filters.fechaHasta);
    if (filters.size)               params.set("size", String(filters.size));
 
    const query = params.toString() ? `?${params.toString()}` : "";
    const safeUsername = encodeURIComponent(username);
    const url = new URL(`/history/${safeUsername}`, USERS_URL);

    // Si 'query' trae el '?', lo quitamos para que el objeto URL lo gestione seguro
    if (query) {
        url.search = query.startsWith('?') ? query.substring(1) : query;
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Error al obtener el historial");
    }
    const data = await response.json();
    return data.history;
}

export interface GameHistoryRecord {
    _id: string;
    username: string;
    rival: string;
    resultado: "1" | "2";
    size?: number;
    createdAt: string;
}

export interface UserStats {
  username: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  mostPlayedRival: string | null;
  rivalStats: Record<string, {
    wins: number;
    losses: number;
    total: number;
  }>;
}

export async function getStats(username: string): Promise<UserStats> {
  if (/[^a-zA-Z0-9_-]/.test(username)) {
    throw new Error("Nombre de usuario inválido");
}
  const response = await fetch(`${USERS_URL}/stats/${username}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Error al obtener las estadísticas');
  }
  return response.json();
}

// Filtros opcionales para getHistory
export interface HistoryFilters {
    resultado?: "1" | "2";
    rival?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    size?: number;
}

export interface RankingEntry {
    position: number;
    username: string;
    score: number;
    totalGames: number;
    wins: number;
}

// Devuelve el top 10 de jugadores ordenados por puntuación de ranking
export async function getRanking(): Promise<RankingEntry[]> {
    const response = await fetch(`${USERS_URL}/ranking`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener el ranking');
    }
    const data = await response.json();
    return data.ranking;
}

// ─────────────────────────────────────────────────────────────────────────────
// FRIENDS & GROUPS SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export interface UserPublicData {
    username: string;
    stats: {
        total: number;
        wins: number;
        losses: number;
        winRate: number;
    };
}

export interface GroupData {
    _id: string;
    name: string;
    description: string;
    createdBy: string;
    isPublic: boolean;
    createdAt: string;
    role?: 'admin' | 'member';
}

export interface GroupMemberData {
    username: string;
    role: 'admin' | 'member';
}

// Obtener datos públicos de un usuario (username, stats resumidas)
export async function getUserPublicData(username: string): Promise<UserPublicData> {
    const response = await fetch(`${USERS_URL}/user/${username}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener datos del usuario');
    }
    return response.json();
}

// Buscar usuarios por nombre
export async function searchUsers(query: string): Promise<UserPublicData[]> {
    try {
        // En una aplicación real, esto vendría de un endpoint /search
        // Por ahora, devolvemos array vacío y esperamos que el usuario escriba un nombre exacto
        if (!query.trim()) return [];
        
        // Intentar obtener el usuario exacto
        const user = await getUserPublicData(query.trim());
        return [user];
    } catch {
        return [];
    }
}

// Agregar un usuario como amigo
export async function addFriend(friendUsername: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const response = await fetch(`${USERS_URL}/addfriend/${friendUsername}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User': currentUser
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al agregar amigo');
    }
}

// Remover un amigo
export async function removeFriend(friendUsername: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const response = await fetch(`${USERS_URL}/removefriend/${friendUsername}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-User': currentUser
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al remover amigo');
    }
}

// Obtener lista de amigos de un usuario
export async function getFriends(username: string): Promise<UserPublicData[]> {
    const response = await fetch(`${USERS_URL}/friends/${username}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener amigos');
    }
    const data = await response.json();
    return data.friends;
}

// Obtener todos los grupos públicos
export async function getGroups(): Promise<GroupData[]> {
    const response = await fetch(`${USERS_URL}/groups`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener grupos');
    }
    const data = await response.json();
    return data.groups;
}

// Crear un nuevo grupo
export async function createGroup(name: string, description: string = ''): Promise<GroupData> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const response = await fetch(`${USERS_URL}/creategroup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User': currentUser
        },
        body: JSON.stringify({ name, description })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al crear grupo');
    }
    const data = await response.json();
    return data.group;
}

// Obtener detalles de un grupo (incluyendo miembros)
export async function getGroupDetails(groupId: string): Promise<{ group: GroupData; members: GroupMemberData[] }> {
    const response = await fetch(`${USERS_URL}/group/${groupId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener detalles del grupo');
    }
    return response.json();
}

// Unirse a un grupo
export async function joinGroup(groupId: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const response = await fetch(`${USERS_URL}/joingroup/${groupId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User': currentUser
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al unirse al grupo');
    }
}

// Salir de un grupo
export async function leaveGroup(groupId: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const response = await fetch(`${USERS_URL}/leavegroup/${groupId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-User': currentUser
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al salir del grupo');
    }
}

// Obtener grupos del usuario actual
export async function getMyGroups(): Promise<GroupData[]> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const response = await fetch(`${USERS_URL}/mygroups`, {
        headers: {
            'X-User': currentUser
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener tus grupos');
    }
    const data = await response.json();
    return data.groups;
}