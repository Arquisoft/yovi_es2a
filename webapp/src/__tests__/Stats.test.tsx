import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import type { UserStats } from '../services/gameService'

vi.mock('../services/gameService', () => ({
    getStats: vi.fn(),
}))

import Stats from '../pages/Stats'
import { getStats } from '../services/gameService'

const statsMock: UserStats = {
    username: 'alice',
    total: 20,
    wins: 14,
    losses: 6,
    winRate: 70,
    currentStreak: 3,
    bestStreak: 7,
    mostPlayedRival: 'random_bot',
    rivalStats: {
        random_bot:     { wins: 8, losses: 2, total: 10 },
        defensive_easy: { wins: 6, losses: 4, total: 10 },
    },
}

describe('Stats', () => {

    beforeEach(() => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()
    })

    // ── Sin sesión ─────────────────────────────────────────────────────────

    it('muestra mensaje de inicio de sesión si no hay usuario en localStorage', () => {
        localStorage.clear()
        render(<Stats />)

        expect(screen.getByText(/debes iniciar sesión/i)).toBeInTheDocument()
    })

    // ── Estado de carga ────────────────────────────────────────────────────

    it('muestra el indicador de carga mientras espera la respuesta', () => {
        vi.mocked(getStats).mockReturnValue(new Promise(() => {}))

        render(<Stats />)

        expect(screen.getByText(/cargando estadísticas/i)).toBeInTheDocument()
    })

    // ── Error de la API ────────────────────────────────────────────────────

    it('muestra el mensaje de error si la API falla', async () => {
        vi.mocked(getStats).mockRejectedValue(new Error('Timeout'))

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/timeout/i)).toBeInTheDocument()
        )
    })

    // ── Sin partidas ───────────────────────────────────────────────────────

    it('muestra el mensaje de sin partidas si total es 0', async () => {
        vi.mocked(getStats).mockResolvedValue({ ...statsMock, total: 0 })

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/no tienes partidas registradas/i)).toBeInTheDocument()
        )
    })

    // ── Renderizado normal ─────────────────────────────────────────────────

    it('muestra el título con el nombre de usuario', async () => {
        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/estadísticas de alice/i)).toBeInTheDocument()
        )
    })

    it('muestra el win rate correctamente', async () => {
        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText('70%')).toBeInTheDocument()
        )
    })

    it('muestra las tarjetas de estadísticas principales', async () => {
        render(<Stats />)

        await waitFor(() => {
            const tarjetas = document.querySelector('.stats-cards') as HTMLElement
            expect(within(tarjetas).getByText('Win Rate')).toBeInTheDocument()
            expect(within(tarjetas).getByText('Partidas jugadas')).toBeInTheDocument()
            expect(within(tarjetas).getByText('✅ Victorias')).toBeInTheDocument()
            expect(within(tarjetas).getByText('❌ Derrotas')).toBeInTheDocument()
        })
    })

    it('muestra la racha actual y la mejor racha', async () => {
        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText(/🔥 3/)).toBeInTheDocument()
            expect(screen.getByText(/⭐ 7/)).toBeInTheDocument()
        })
    })

    // ── Rival favorito ─────────────────────────────────────────────────────

    it('muestra el rival favorito cuando existe', async () => {
        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText('Rival favorito')).toBeInTheDocument()
        )
    })

    it('no muestra el rival favorito si mostPlayedRival es null', async () => {
        vi.mocked(getStats).mockResolvedValue({ ...statsMock, mostPlayedRival: null })

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/estadísticas de alice/i)).toBeInTheDocument()
        )
        expect(screen.queryByText(/rival favorito/i)).not.toBeInTheDocument()
    })

    // ── Tabla por rival ────────────────────────────────────────────────────

    it('renderiza las tarjetas de rivales con nombres amigables', async () => {
        render(<Stats />)

        await waitFor(() => {
            // Los nombres amigables deben aparecer, no los identificadores internos
            expect(screen.getByText('Bot Defensivo (Fácil)')).toBeInTheDocument()
            expect(screen.getAllByText('Bot Aleatorio').length).toBeGreaterThanOrEqual(1)
        })
    })

    it('no muestra los identificadores internos con guiones bajos', async () => {
        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/estadísticas de alice/i)).toBeInTheDocument()
        )
        expect(screen.queryByText('defensive_easy')).not.toBeInTheDocument()
        expect(screen.queryByText('random_bot')).not.toBeInTheDocument()
    })

    it('muestra el win rate correcto en la tabla por rival', async () => {
        render(<Stats />)

        await waitFor(() =>
            // random_bot: 8/10 = 80%
            expect(screen.getByText('80%')).toBeInTheDocument()
        )
    })
})