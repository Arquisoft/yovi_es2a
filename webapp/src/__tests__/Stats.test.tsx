// Tests del componente Stats — estadísticas del jugador
import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import Stats from '../pages/Stats'

vi.mock('../services/gameService', () => ({
    getStats: vi.fn(),
}))

import { getStats } from '../services/gameService'

const mockStats = {
    username: 'testuser',
    total: 20,
    wins: 14,
    losses: 6,
    winRate: 70,
    currentStreak: 3,
    bestStreak: 7,
    mostPlayedRival: 'random_bot',
    rivalStats: {
        random_bot: { total: 10, wins: 8, losses: 2 },
        invitado:   { total: 10, wins: 6, losses: 4 },
    },
}

describe('Stats', () => {
    beforeEach(() => {
        localStorage.setItem('username', 'testuser')
        vi.mocked(getStats).mockResolvedValue(mockStats)
    })

    afterEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    test('muestra las tarjetas de estadísticas principales', async () => {
        render(<Stats />)

        await waitFor(() => {
            // Convertimos el elemento en un HTMLElement para que funcione con within
            const tarjetas = document.querySelector('.stats-cards') as HTMLElement
            expect(within(tarjetas).getByText('Win Rate')).toBeInTheDocument()
            expect(within(tarjetas).getByText('Partidas jugadas')).toBeInTheDocument()
            expect(within(tarjetas).getByText('✅ Victorias')).toBeInTheDocument()
            expect(within(tarjetas).getByText('❌ Derrotas')).toBeInTheDocument()
        })
    })

    test('muestra la racha actual y la mejor racha', async () => {
        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText('🔥 3')).toBeInTheDocument()
            expect(screen.getByText('⭐ 7')).toBeInTheDocument()
        })
    })

    test('muestra el rival más jugado', async () => {
        render(<Stats />)

        await waitFor(() => {
            // El label "Rival favorito" es único, lo usamos como ancla
            expect(screen.getByText('Rival favorito')).toBeInTheDocument()
            // getAllByText porque random_bot aparece en tarjeta Y en tabla
            expect(screen.getAllByText('random_bot').length).toBeGreaterThanOrEqual(1)
        })
    })

    test('muestra la tabla de estadísticas por rival', async () => {
        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText('invitado')).toBeInTheDocument()
            // Win rate de random_bot: 8/10 = 80%
            expect(screen.getByText('80%')).toBeInTheDocument()
        })
    })

    test('muestra mensaje si no hay usuario logueado', () => {
        localStorage.clear()
        render(<Stats />)
        expect(screen.getByText(/debes iniciar sesión/i)).toBeInTheDocument()
    })

    test('muestra mensaje si no hay partidas registradas', async () => {
        vi.mocked(getStats).mockResolvedValue({ ...mockStats, total: 0 })
        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText(/no tienes partidas registradas/i)).toBeInTheDocument()
        })
    })

    test('muestra error si getStats falla', async () => {
        vi.mocked(getStats).mockRejectedValue(new Error('Timeout'))
        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText(/timeout/i)).toBeInTheDocument()
        })
    })
})
