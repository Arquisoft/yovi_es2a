import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import type { RankingEntry } from '../services/gameService'

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('../services/gameService', () => ({
    getRanking: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

// Navbar y AuthComprobation no son relevantes para estos tests
vi.mock('../components/Navbar', () => ({
    default: () => <div data-testid="navbar" />,
}))
vi.mock('../components/AuthComprobation', () => ({
    useAuthComprobation: () => {},
}))

import Ranking from '../pages/Ranking'
import { getRanking } from '../services/gameService'
import { MemoryRouter } from 'react-router-dom'

// ── Datos de prueba ────────────────────────────────────────────────────────

const rankingMock: RankingEntry[] = [
    { position: 1, username: 'bob',   score: 14.0, totalGames: 3,  wins: 2 },
    { position: 2, username: 'alice', score:  3.0, totalGames: 5,  wins: 3 },
    { position: 3, username: 'carol', score:  1.5, totalGames: 10, wins: 1 },
]

function renderRanking() {
    return render(
        <MemoryRouter>
            <Ranking />
        </MemoryRouter>
    )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Ranking', () => {

    beforeEach(() => {
        localStorage.setItem('username', 'alice')
        vi.mocked(getRanking).mockResolvedValue(rankingMock)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()
    })

    // ── Estado de carga ────────────────────────────────────────────────────

    it('muestra el indicador de carga mientras espera la respuesta', () => {
        vi.mocked(getRanking).mockReturnValue(new Promise(() => {}))

        renderRanking()

        expect(screen.getByText(/cargando ranking/i)).toBeInTheDocument()
    })

    // ── Error de la API ────────────────────────────────────────────────────

    it('muestra el mensaje de error si la API falla', async () => {
        vi.mocked(getRanking).mockRejectedValue(new Error('Error de red'))

        renderRanking()

        await waitFor(() =>
            expect(screen.getByText(/error: error de red/i)).toBeInTheDocument()
        )
    })

    // ── Ranking vacío ──────────────────────────────────────────────────────

    it('muestra mensaje cuando no hay partidas registradas', async () => {
        vi.mocked(getRanking).mockResolvedValue([])

        renderRanking()

        await waitFor(() =>
            expect(screen.getByText(/no hay partidas registradas/i)).toBeInTheDocument()
        )
    })

    // ── Renderizado de la tabla ────────────────────────────────────────────

    it('muestra el título del ranking', async () => {
        renderRanking()

        await waitFor(() =>
            expect(screen.getByText(/ranking/i)).toBeInTheDocument()
        )
    })

    it('renderiza una fila por cada entrada del ranking', async () => {
        renderRanking()

        await waitFor(() => {
            expect(screen.getByText('bob')).toBeInTheDocument()
            expect(screen.getByText('alice')).toBeInTheDocument()
            expect(screen.getByText('carol')).toBeInTheDocument()
        })
    })

    it('muestra la puntuación de cada jugador formateada con decimales', async () => {
        renderRanking()

        await waitFor(() => {
            expect(screen.getByText('14.00')).toBeInTheDocument()
            expect(screen.getByText('3.00')).toBeInTheDocument()
            expect(screen.getByText('1.50')).toBeInTheDocument()
        })
    })

    it('muestra el total de partidas y victorias de cada jugador', async () => {
        renderRanking()

        await waitFor(() =>
            expect(screen.getByText('bob')).toBeInTheDocument()
        )

        // Buscamos dentro de la fila de cada jugador para evitar ambigüedades
        const filaBob   = screen.getByText('bob').closest('tr')!
        const filaAlice = screen.getByText('alice').closest('tr')!
        const filaCarol = screen.getByText('carol').closest('tr')!

        expect(within(filaBob).getByText('3')).toBeInTheDocument()    // totalGames bob
        expect(within(filaBob).getByText('2')).toBeInTheDocument()    // wins bob
        expect(within(filaAlice).getByText('5')).toBeInTheDocument()  // totalGames alice
        expect(within(filaAlice).getByText('3')).toBeInTheDocument()  // wins alice
        expect(within(filaCarol).getByText('10')).toBeInTheDocument() // totalGames carol
        expect(within(filaCarol).getByText('1')).toBeInTheDocument()  // wins carol
    })

    // ── Medallas top 3 ────────────────────────────────────────────────────

    it('muestra 🥇 para el primer puesto', async () => {
        renderRanking()

        await waitFor(() =>
            expect(screen.getByText('🥇')).toBeInTheDocument()
        )
    })

    it('muestra 🥈 para el segundo puesto', async () => {
        renderRanking()

        await waitFor(() =>
            expect(screen.getByText('🥈')).toBeInTheDocument()
        )
    })

    it('muestra 🥉 para el tercer puesto', async () => {
        renderRanking()

        await waitFor(() =>
            expect(screen.getByText('🥉')).toBeInTheDocument()
        )
    })

    it('muestra el número de posición en lugar de medalla para puestos > 3', async () => {
        const rankingConMas: RankingEntry[] = [
            ...rankingMock,
            { position: 4, username: 'dave', score: 1.0, totalGames: 2, wins: 1 },
        ]
        vi.mocked(getRanking).mockResolvedValue(rankingConMas)

        renderRanking()

        await waitFor(() =>
            expect(screen.getByText('4')).toBeInTheDocument()
        )
    })
})