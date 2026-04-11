import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import type { UserStats } from '../services/gameService'

// Mock del servicio ANTES de importar el componente
vi.mock('../services/gameService', () => ({
    getStats: vi.fn(),
}))

import Stats from '../pages/Stats'
import { getStats } from '../services/gameService'

// Stats de ejemplo reutilizables
const statsMock: UserStats = {
    username: 'alice',
    total: 5,
    wins: 3,
    losses: 2,
    winRate: 60,
    currentStreak: 2,
    bestStreak: 3,
    mostPlayedRival: 'random_bot',
    rivalStats: {
        random_bot:     { wins: 3, losses: 0, total: 3 },
        defensive_easy: { wins: 0, losses: 2, total: 2 },
    },
}

describe('Stats', () => {

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
        localStorage.setItem('username', 'alice')
        // getStats nunca resuelve → el componente se queda en loading
        vi.mocked(getStats).mockReturnValue(new Promise(() => {}))

        render(<Stats />)

        expect(screen.getByText(/cargando estadísticas/i)).toBeInTheDocument()
    })

    // ── Error de la API ────────────────────────────────────────────────────

    it('muestra el mensaje de error si la API falla', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockRejectedValue(new Error('Error de red'))

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/error: error de red/i)).toBeInTheDocument()
        )
    })

    // ── Sin partidas ───────────────────────────────────────────────────────

    it('muestra el mensaje de sin partidas si total es 0', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue({ ...statsMock, total: 0 })

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/todavía no tienes partidas/i)).toBeInTheDocument()
        )
    })
})