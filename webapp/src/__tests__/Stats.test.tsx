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

    // ── Renderizado normal ─────────────────────────────────────────────────

    it('muestra el título con el nombre de usuario', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/estadísticas de alice/i)).toBeInTheDocument()
        )
    })

    it('muestra el win rate correctamente', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText('60%')).toBeInTheDocument()
        )
    })

    it('muestra el total de partidas jugadas', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText('5')).toBeInTheDocument()
        )
    })

    it('muestra las victorias y derrotas', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)

        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText('✅ Victorias')).toBeInTheDocument()
            expect(screen.getByText('❌ Derrotas')).toBeInTheDocument()
        })
    })

    it('muestra la racha actual y la mejor racha', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)

        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText(/🔥 2/)).toBeInTheDocument()
            expect(screen.getByText(/⭐ 3/)).toBeInTheDocument()
        })
    })

    it('muestra el rival favorito cuando existe', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText('Rival favorito')).toBeInTheDocument()
        )
    })

    // ── Tabla por rival ────────────────────────────────────────────────────

    it('renderiza la tabla de rivales con sus filas', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue(statsMock)

        render(<Stats />)

        await waitFor(() => {
            expect(screen.getByText('defensive_easy')).toBeInTheDocument()
        })
    })

    it('no muestra el rival favorito si mostPlayedRival es null', async () => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getStats).mockResolvedValue({ ...statsMock, mostPlayedRival: null })

        render(<Stats />)

        await waitFor(() =>
            expect(screen.getByText(/estadísticas de alice/i)).toBeInTheDocument()
        )
        expect(screen.queryByText(/rival favorito/i)).not.toBeInTheDocument()
    })
})