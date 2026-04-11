// Tests del componente Lobby — configuración de la partida 
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock de navegación ANTES de importar el componente
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

// Mock del guard de autenticación para que no redirija
vi.mock('../components/AuthComprobation', () => ({
    useAuthComprobation: vi.fn(),
}))

vi.mock('../components/Navbar', () => ({
    default: () => <nav data-testid="navbar" />,
}))

import Lobby from '../pages/Lobby'
import { MemoryRouter } from 'react-router-dom'

describe('Lobby', () => {
    beforeEach(() => {
        localStorage.setItem('username', 'testuser')
    })

    afterEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    const renderLobby = () =>
        render(
            <MemoryRouter>
                <Lobby />
            </MemoryRouter>
        )

    test('renderiza el título y el selector de tamaño de tablero', () => {
        renderLobby()
        expect(screen.getByText(/elige tu partida/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/tamaño del tablero/i)).toBeInTheDocument()
    })

    test('el botón Jugar está deshabilitado hasta seleccionar modo', () => {
        renderLobby()
        expect(screen.getByRole('button', { name: /selecciona un modo/i })).toBeDisabled()
    })

    test('seleccionar "vs Humano" habilita el botón Jugar', async () => {
        const user = userEvent.setup()
        renderLobby()

        await user.click(screen.getByText(/vs humano/i))

        expect(screen.getByRole('button', { name: '¡JUGAR!' })).not.toBeDisabled()
    })

    test('seleccionar "vs Máquina" muestra las opciones de bot', async () => {
        const user = userEvent.setup()
        renderLobby()

        await user.click(screen.getByText(/vs máquina/i))

        expect(screen.getByText('Aleatorio')).toBeInTheDocument()
        expect(screen.getByText('Defensivo')).toBeInTheDocument()
        expect(screen.getByText('Monte Carlo')).toBeInTheDocument()
    })

    test('el bot "Aleatorio" no muestra selector de dificultad', async () => {
        const user = userEvent.setup()
        renderLobby()

        await user.click(screen.getByText(/vs máquina/i))
        await user.click(screen.getByText('Aleatorio'))

        expect(screen.queryByText('FÁCIL')).not.toBeInTheDocument()
    })

    test('el bot "Defensivo" sí muestra selector de dificultad', async () => {
        const user = userEvent.setup()
        renderLobby()

        await user.click(screen.getByText(/vs máquina/i))
        await user.click(screen.getByText('Defensivo'))

        expect(screen.getByText('FÁCIL')).toBeInTheDocument()
        expect(screen.getByText('MEDIO')).toBeInTheDocument()
        expect(screen.getByText('DIFÍCIL')).toBeInTheDocument()
    })

    test('navega a /game con el modo correcto al jugar vs humano', async () => {
        const user = userEvent.setup()
        renderLobby()

        await user.click(screen.getByText(/vs humano/i))
        await user.click(screen.getByRole('button', { name: '¡JUGAR!' }))

        expect(mockNavigate).toHaveBeenCalledWith('/game', {
            state: expect.objectContaining({ mode: 'human' }),
        })
    })

    test('navega a /game con botId correcto al jugar vs máquina', async () => {
        const user = userEvent.setup()
        renderLobby()

        await user.click(screen.getByText(/vs máquina/i))
        await user.click(screen.getByText('Defensivo'))
        await user.click(screen.getByText('DIFÍCIL'))
        await user.click(screen.getByRole('button', { name: '¡JUGAR!' }))

        expect(mockNavigate).toHaveBeenCalledWith('/game', {
            state: expect.objectContaining({ botId: 'defensive_hard', mode: 'computer' }),
        })
    })

    test('el slider de tamaño actualiza el valor mostrado', async () => {
        renderLobby()

        const slider = screen.getByRole('slider')
        Object.defineProperty(slider, 'value', { configurable: true, value: '11' })
        slider.dispatchEvent(new Event('input', { bubbles: true }))

        await waitFor(() => {
            expect(screen.getByText(/11 x 11/i)).toBeInTheDocument()
        })
    })

    test('el botón "← Menú" navega a /menu', async () => {
        const user = userEvent.setup()
        renderLobby()

        await user.click(screen.getByText(/← menú/i))
        expect(mockNavigate).toHaveBeenCalledWith('/menu')
    })

    test('navega a / si no hay usuario en localStorage', async () => {
        localStorage.clear()
        renderLobby()

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/')
        })
    })
})
