// src/__tests__/gameService.test.ts
import { describe, test, expect, vi, afterEach } from 'vitest'
import {
    createGame,
    getGame,
    placeToken,
    resign,
    saveGameResult,
    getHistory,
    getStats,
} from '../services/gameService'

// Definimos el estado de la partida que se usará en las respuestas mockeadas
const mockApiState = {
    game_id: 'game-123',
    board_size: 7,
    total_cells: 49,
    cells: [],
    available_cells: [],
    status: 'ongoing',
    next_player: 0,
    winner: null,
}

const mockMoveResponse = {
    applied_move: { player: 0, action: 'place', cell_index: 3 },
    bot_move: null,
    game_state: mockApiState,
}

// Mockea la respuesta exitosa
function mockFetchOk(data: unknown) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => data,
    } as Response)
}

// Mockea la respuesta de error
function mockFetchError(error: string, status = 400) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ error }),
    } as Response)
}

describe('gameService', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    // describe es una función de Vitest que agrupa un conjunto de pruebas relacionadas.
    describe('createGame', () => {
        test('llama al endpoint correcto y devuelve el estado inicial', async () => {
            mockFetchOk(mockApiState)

            const result = await createGame(7, 'human', 'random_bot')

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/game/new'),
                expect.objectContaining({ method: 'POST' })
            )
            expect(result.game_id).toBe('game-123')
        })

        test('lanza error si la respuesta no es ok', async () => {
            mockFetchError('Error al crear la partida')

            await expect(createGame(7)).rejects.toThrow('Error al crear la partida')
        })
    })

    describe('getGame', () => {
        test('llama al endpoint con el gameId correcto', async () => {
            mockFetchOk(mockApiState)

            const result = await getGame('game-123')

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/game/game-123'))
            expect(result.game_id).toBe('game-123')
        })

        test('lanza error si la partida no existe', async () => {
            mockFetchError('Partida no encontrada', 404)

            await expect(getGame('inexistente')).rejects.toThrow('Partida no encontrada')
        })
    })

    describe('placeToken', () => {
        test('envía el movimiento correctamente sin bot', async () => {
            mockFetchOk(mockMoveResponse)

            const result = await placeToken('game-123', 0, 3)

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/game/game-123/move'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"cell_index":3'),
                })
            )
            expect(result.applied_move.cell_index).toBe(3)
        })

        test('incluye el botId en el body cuando se pasa', async () => {
            mockFetchOk(mockMoveResponse)

            await placeToken('game-123', 0, 3, 'defensive_easy')

            expect(fetch).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    body: expect.stringContaining('"bot":"defensive_easy"'),
                })
            )
        })

        test('lanza error si el movimiento es inválido', async () => {
            mockFetchError('Movimiento inválido')

            await expect(placeToken('game-123', 0, 99)).rejects.toThrow('Movimiento inválido')
        })
    })

    describe('resign', () => {
        test('envía la acción resign correctamente', async () => {
            mockFetchOk(mockMoveResponse)

            await resign('game-123', 0)

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/game/game-123/move'),
                expect.objectContaining({
                    body: expect.stringContaining('"action":"resign"'),
                })
            )
        })

        test('lanza error si falla la rendición', async () => {
            mockFetchError('Error al rendirse')

            await expect(resign('game-123', 0)).rejects.toThrow('Error al rendirse')
        })
    })

    describe('saveGameResult', () => {
        test('envía el resultado al endpoint correcto', async () => {
            mockFetchOk({})

            await saveGameResult('testuser', 'random_bot', '1', 7)

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/savegame'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"resultado":"1"'),
                })
            )
        })

        test('lanza error si falla el guardado', async () => {
            mockFetchError('Error al guardar la partida')

            await expect(saveGameResult('testuser', 'bot', '1', 7))
                .rejects.toThrow('Error al guardar la partida')
        })
    })

    describe('getHistory', () => {
        const mockHistory = [
            { _id: '1', username: 'testuser', rival: 'bot', resultado: '1' as const, size: 7, createdAt: '2024-01-01' },
        ]

        test('devuelve el historial sin filtros', async () => {
            mockFetchOk({ history: mockHistory })

            const result = await getHistory('testuser')

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/history/testuser'))
            expect(result).toHaveLength(1)
            expect(result[0].rival).toBe('bot')
        })

        test('añade los filtros como query params', async () => {
            mockFetchOk({ history: mockHistory })

            await getHistory('testuser', { resultado: '1', rival: 'bot', size: 7 })

            const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
            expect(url).toContain('resultado=1')
            expect(url).toContain('rival=bot')
            expect(url).toContain('size=7')
        })

        test('lanza error si falla la petición', async () => {
            mockFetchError('Error al obtener el historial')

            await expect(getHistory('testuser')).rejects.toThrow('Error al obtener el historial')
        })
    })

    describe('getStats', () => {
        const mockStats = {
            username: 'testuser',
            total: 10,
            wins: 7,
            losses: 3,
            winRate: 70,
            currentStreak: 2,
            bestStreak: 5,
            mostPlayedRival: 'random_bot',
            rivalStats: { random_bot: { wins: 7, losses: 3, total: 10 } },
        }

        test('devuelve las estadísticas del usuario', async () => {
            mockFetchOk(mockStats)

            const result = await getStats('testuser')

            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/stats/testuser'))
            expect(result.winRate).toBe(70)
            expect(result.mostPlayedRival).toBe('random_bot')
        })

        test('lanza error si falla la petición', async () => {
            mockFetchError('Error al obtener las estadísticas')

            await expect(getStats('testuser')).rejects.toThrow('Error al obtener las estadísticas')
        })
    })
})