// Esta clase contiene todas las conexiones entre la API de rust y la lógica del juego en React.

import type { ApiGameState, ApiMakeMoveResponse } from "../types/gameApi";

const BACKEND_URL = import.meta.env.VITE_GAMEY_URL ?? "http://localhost:4000";
const USERS_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function sanitizeParam(param: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
        throw new Error("Parámetro inválido por seguridad. Formato incorrecto.");
    }
    return encodeURIComponent(param);
}

// Llamada que crea el juego
export async function createGame(
    size: number,
    mode: "human" | "computer" = "human",
    bot: string = "random_bot",
    timer?: number | null,
): Promise<ApiGameState> {
    const response = await fetch(`${BACKEND_URL}/game/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, mode, bot, timer }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Error al crear la partida");
    }
    return response.json();
}

export async function getGame(gameId: string): Promise<ApiGameState> {
    const safeId = sanitizeParam(gameId);
    const response = await fetch(`${BACKEND_URL}/game/${safeId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Partida no encontrada");
    }
    return response.json();
}

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

    const safeId = sanitizeParam(gameId);
    const response = await fetch(`${BACKEND_URL}/game/${safeId}/move`, {
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

// Método para que un jugador se rinda
export async function resign(
    gameId: string,
    player: number
): Promise<ApiMakeMoveResponse> {
    const safeId = sanitizeParam(gameId);
    const response = await fetch(`${BACKEND_URL}/game/${safeId}/move`, {
        method: 'POST',
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

    if (botId) body.bot = botId;

    const safeId = sanitizeParam(gameId);
    const response = await fetch(`${BACKEND_URL}/game/${safeId}/move`, {
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
 
    const safeUsername = sanitizeParam(username);
    const url = new URL(`/history/${safeUsername}`, USERS_URL);

    const query = params.toString();
    if (query) {
        url.search = query;
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
  const safeUsername = sanitizeParam(username);
  const response = await fetch(`${USERS_URL}/stats/${safeUsername}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Error al obtener las estadísticas');
  }
  return response.json();
}

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

export async function getRanking(): Promise<RankingEntry[]> {
    const response = await fetch(`${USERS_URL}/ranking`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener el ranking');
    }
    const data = await response.json();
    return data.ranking;
}


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

export async function getUserPublicData(username: string): Promise<UserPublicData> {
    const safeUsername = sanitizeParam(username);
    const response = await fetch(`${USERS_URL}/user/${safeUsername}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener datos del usuario');
    }
    return response.json();
}

export async function searchUsers(query: string): Promise<UserPublicData[]> {
    try {
        if (!query.trim()) return [];
        const user = await getUserPublicData(query.trim());
        return [user];
    } catch {
        return [];
    }
}

export async function addFriend(friendUsername: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const safeFriend = sanitizeParam(friendUsername);
    const response = await fetch(`${USERS_URL}/addfriend/${safeFriend}`, {
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

export async function removeFriend(friendUsername: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const safeFriend = sanitizeParam(friendUsername);
    const response = await fetch(`${USERS_URL}/removefriend/${safeFriend}`, {
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

export async function getFriends(username: string): Promise<UserPublicData[]> {
    const safeUsername = sanitizeParam(username);
    const response = await fetch(`${USERS_URL}/friends/${safeUsername}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener amigos');
    }
    const data = await response.json();
    return data.friends;
}

export async function getGroups(): Promise<GroupData[]> {
    const response = await fetch(`${USERS_URL}/groups`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener grupos');
    }
    const data = await response.json();
    return data.groups;
}

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

export async function getGroupDetails(groupId: string): Promise<{ group: GroupData; members: GroupMemberData[] }> {
    const safeId = sanitizeParam(groupId);
    const response = await fetch(`${USERS_URL}/group/${safeId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? 'Error al obtener detalles del grupo');
    }
    return response.json();
}

export async function joinGroup(groupId: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const safeId = sanitizeParam(groupId);
    const response = await fetch(`${USERS_URL}/joingroup/${safeId}`, {
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

export async function leaveGroup(groupId: string): Promise<void> {
    const currentUser = localStorage.getItem('username');
    if (!currentUser) throw new Error('No estás autenticado');

    const safeId = sanitizeParam(groupId);
    const response = await fetch(`${USERS_URL}/leavegroup/${safeId}`, {
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