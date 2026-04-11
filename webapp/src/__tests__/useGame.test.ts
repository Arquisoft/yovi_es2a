// Tests del hook useGame — lógica principal del juego
import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGame } from '../hooks/useGame'

// ── Mocks de servicios ──────────────────────────────────────────────────────

const mockApiState = {
    game_id: 'game-123',
    board_size: 7,
    total_cells: 49,
    // Se usan simplificaciones de las coordenadas para mayor facilidad
    cells: [
        { index: 0, coords: [0, 0, 0] as [number, number, number], player: null },
        { index: 1, coords: [1, 0, 0] as [number, number, number], player: null },
    ],
    available_cells: [0, 1],
    status: 'ongoing' as const,
    next_player: 0,
    winner: null,
}

const mockFinishedState = {
    ...mockApiState,
    status: 'finished' as const,
    next_player: null,
    winner: 0,
}

// Mock de los servicios antes de importar el hook
vi.mock('../services/gameService', () => ({
    createGame: vi.fn(),
    placeToken: vi.fn(),
    resign: vi.fn(),
    saveGameResult: vi.fn(),
}))

import { createGame, placeToken, resign, saveGameResult } from '../services/gameService'

describe('useGame', () => {
    beforeEach(() => {
        vi.mocked(createGame).mockResolvedValue(mockApiState)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    test('inicia en estado "loading" y pasa a "ongoing" tras crear partida', async () => {
        const { result } = renderHook(() => useGame())

        // Al montar debe estar cargando
        expect(result.current.status).toBe('loading')

        await waitFor(() => {
            expect(result.current.status).toBe('ongoing')
        })

        expect(createGame).toHaveBeenCalledWith(7, 'human', 'random_bot')
    })

    test('convierte las celdas de la API al formato TableCell correctamente', async () => {
        const { result } = renderHook(() => useGame())

        await waitFor(() => expect(result.current.status).toBe('ongoing'))

        expect(result.current.cells[0]).toEqual({
            id: 0,
            x: 0,
            y: 0,
            z: 0,
            owner: null,
        })
    })

    test('el jugador inicial es PLAYER_ONE', async () => {
        const { result } = renderHook(() => useGame())
        await waitFor(() => expect(result.current.status).toBe('ongoing'))
        expect(result.current.currentPlayer).toBe('PLAYER_ONE')
    })

    test('handleCellClick actualiza el estado tras un movimiento válido', async () => {
        const stateAfterMove = {
            ...mockApiState,
            cells: [
                { index: 0, coords: [0, 0, 0] as [number, number, number], player: 0 },
                { index: 1, coords: [1, 0, 0] as [number, number, number], player: null },
            ],
            next_player: 1,
        }

        vi.mocked(placeToken).mockResolvedValue({ game_state: stateAfterMove, applied_move: { player: 0, action: 'place', cell_index: 0 }, bot_move: null })

        const { result } = renderHook(() => useGame({ mode: 'human' }))
        await waitFor(() => expect(result.current.status).toBe('ongoing'))

        result.current.handleCellClick(0)

        await waitFor(() => {
            expect(result.current.cells[0].owner).toBe('PLAYER_ONE')
            expect(result.current.currentPlayer).toBe('PLAYER_TWO')
        })
    })

    test('handleResign termina la partida con el ganador correcto', async () => {
        vi.mocked(resign).mockResolvedValue({ game_state: mockFinishedState, applied_move: { player: 0, action: 'resign', cell_index: null }, bot_move: null })

        const { result } = renderHook(() => useGame())
        await waitFor(() => expect(result.current.status).toBe('ongoing'))

        result.current.handleResign()

        await waitFor(() => {
            expect(result.current.status).toBe('finished')
            expect(result.current.winner).toBe('PLAYER_ONE')
        })
    })

    test('resetGame vuelve a crear una partida nueva', async () => {
        const { result } = renderHook(() => useGame())
        await waitFor(() => expect(result.current.status).toBe('ongoing'))

        act(() => {
            result.current.resetGame()
        })

        // createGame se llama dos veces: al montar y al resetear
        await waitFor(() => {
            expect(createGame).toHaveBeenCalledTimes(2)
        })
    })

    test('guarda el resultado cuando la partida termina y hay usuario logueado', async () => {
        vi.mocked(placeToken).mockResolvedValue({ game_state: mockFinishedState, applied_move: { player: 0, action: 'place', cell_index: 0 }, bot_move: null })
        vi.mocked(saveGameResult).mockResolvedValue(undefined)

        const { result } = renderHook(() =>
            useGame({ username: 'testuser', mode: 'computer', botId: 'random_bot', size: 7 })
        )
        await waitFor(() => expect(result.current.status).toBe('ongoing'))

        result.current.handleCellClick(0)

        await waitFor(() => {
            expect(saveGameResult).toHaveBeenCalledWith('testuser', 'random_bot', '1', 7)
        })
    })

    test('muestra error cuando createGame falla', async () => {
        vi.mocked(createGame).mockRejectedValue(new Error('Fallo de red'))

        const { result } = renderHook(() => useGame())

        await waitFor(() => {
            expect(result.current.error).toBe('Fallo de red')
        })
    })

test('muestra error cuando placeToken falla', async () => {
    vi.mocked(placeToken).mockRejectedValue(new Error('Movimiento inválido'))

    const { result } = renderHook(() => useGame())
    await waitFor(() => expect(result.current.status).toBe('ongoing'))

    result.current.handleCellClick(0)

    await waitFor(() => {
        expect(result.current.error).toBe('Movimiento inválido')
    })
})

    test('pasa el botId correcto al placeToken en modo computer', async () => {
        vi.mocked(placeToken).mockResolvedValue({ game_state: mockApiState, applied_move: { player: 0, action: 'place', cell_index: 0 }, bot_move: null })

        const { result } = renderHook(() =>
            useGame({ mode: 'computer', botId: 'defensive_easy' })
        )
        await waitFor(() => expect(result.current.status).toBe('ongoing'))

        result.current.handleCellClick(1)

        expect(placeToken).toHaveBeenCalledWith('game-123', 0, 1, 'defensive_easy')
    })
})
