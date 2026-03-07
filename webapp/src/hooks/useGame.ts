// Esta clase contiene los hooks relacionados con la lógica del juego

import { useState, useEffect, useCallback } from "react";
import type { TableCell, Player } from "../types/game";
import { createGame, placeToken, resign as resignService, saveGameResult } from "../services/gameService";
import type { ApiGameState } from "../types/gameApi";

//  ────────────────────Tipos────────────────────────────────────────────────────────────

// Opciones de configuración de la partida
interface UseGameOptions {
    size?: number;
    mode?: "human" | "computer";
    botId?: string;
    username?: string;
}

// Lo que devuelve el hook useGame
interface UseGameReturn {
    cells: TableCell[];
    currentPlayer: Player;
    winner: Player;
    gameId: string | null;
    status: "ongoing" | "finished" | "loading";
    error: string | null;
    handleCellClick: (cellIndex: number) => void;
    handleResign: () => void;
    resetGame: () => void;
}

//  ───────────────Funciones útiles de conversión────────────────────────────────────────────────

// Convierte el estado de la API al formato de TableCell que usa React
function apiStateToCell(apiState: ApiGameState): TableCell[] {
    return apiState.cells.map(cell => ({
        id: cell.index,
        x: cell.coords[0],
        y: cell.coords[1],
        z: cell.coords[2],
        owner: cell.player === 0
            ? "PLAYER_ONE"
            : cell.player === 1
                ? "PLAYER_TWO"
                : null,
    }));
}

// Convierte el ID de jugador de la API a nuestro tipo Player
function playerIdToPlayer(id: number | null): Player {
    if (id === 0) return "PLAYER_ONE";
    if (id === 1) return "PLAYER_TWO";
    return null;
}

//  ───────────────Hooks────────────────────────────────────────────────

// Hook de React que maneja toda la lógica del juego
export function useGame({
    size = 7,
    mode = "human",
    botId = "random_bot",
    username,
}: UseGameOptions = {}): UseGameReturn {
    const [gameId, setGameId] = useState<string | null>(null);
    const [cells, setCells] = useState<TableCell[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<Player>("PLAYER_ONE");
    const [winner, setWinner] = useState<Player>(null);
    const [status, setStatus] = useState<"ongoing" | "finished" | "loading">("loading");
    const [error, setError] = useState<string | null>(null);

    // Aplica un ApiGameState al estado local de React
    const applyGameState = useCallback((apiState: ApiGameState) => {
        setCells(apiStateToCell(apiState));
        setCurrentPlayer(playerIdToPlayer(apiState.next_player));
        setWinner(playerIdToPlayer(apiState.winner));
        setStatus(apiState.status);
        
    // Solo guardamos cuando termina la partida y hay un usuario logueado
        if (apiState.status === "finished" && username) {
            const rival = mode === "computer" ? botId : "invitado";
            // '1' = gana el jugador 0 (usuario), '2' = gana el jugador 1 (rival), 'X' = empate
            const resultado: "1" | "2" | "X" =
                apiState.winner === 0 ? "1" :
                apiState.winner === 1 ? "2" : "X";
            saveGameResult(username, rival, resultado).catch((e) => {
                console.error("Error al guardar historial:", e);
            });
        }
    }, [username, mode, botId]);

    // Crea una partida nueva al montar el componente
    const initGame = useCallback(async () => {
        setStatus("loading");
        setError(null);
        try {
            const apiState = await createGame(size, mode, botId);
            setGameId(apiState.game_id);
            applyGameState(apiState);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error desconocido");
            setStatus("ongoing");
        }
    }, [size, mode, botId, applyGameState]);

    useEffect(() => {
        initGame();
    }, [initGame]);

    // El jugador hace click en una celda
    const handleCellClick = useCallback(async (cellIndex: number) => {
        if (!gameId || status !== "ongoing") return;

        const player = currentPlayer === "PLAYER_ONE" ? 0 : 1;
        const bot = mode === "computer" ? botId : undefined;

        setError(null);
        try {
            const result = await placeToken(gameId, player, cellIndex, bot);
            applyGameState(result.game_state);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Movimiento inválido");
        }
    }, [gameId, status, currentPlayer, mode, botId, applyGameState]);

    // El jugador activo se rinde
    const handleResign = useCallback(async () => {
        if (!gameId || status !== "ongoing") return;

        const player = currentPlayer === "PLAYER_ONE" ? 0 : 1;
        setError(null);
        try {
            const result = await resignService(gameId, player);
            applyGameState(result.game_state);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al rendirse");
        }
    }, [gameId, status, currentPlayer, applyGameState]);

    // Reinicia la partida
    const resetGame = useCallback(() => {
        initGame();
    }, [initGame]);

    return {
        cells,
        currentPlayer,
        winner,
        gameId,
        status,
        error,
        handleCellClick,
        handleResign,
        resetGame,
    };
}