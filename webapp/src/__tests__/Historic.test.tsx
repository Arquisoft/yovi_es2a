// Tests del componente Historic — historial de partidas con filtros
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import Historic from '../pages/Historic'

// ── Mock de servicios ────────────────────────────────────────────────────────

vi.mock('../services/gameService', () => ({
    getHistory: vi.fn(),
}))

import { getHistory } from '../services/gameService'

const mockRecords = [
    {
        _id: 'abc1',
        username: 'testuser',
        rival: 'random_bot',
        // Se usa "1" y "2" como constantes para evitar errores con strings
        resultado: "1" as const,
        size: 7,
        createdAt: '2024-03-15T10:30:00.000Z',
    },
    {
        _id: 'abc2',
        username: 'testuser',
        rival: 'invitado',
        resultado: "2" as const,
        size: 11,
        createdAt: '2024-03-16T14:00:00.000Z',
    },
]

describe('Historic', () => {
    beforeEach(() => {
        localStorage.setItem('username', 'testuser')
        vi.mocked(getHistory).mockResolvedValue(mockRecords)
    })

    afterEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    test('muestra el historial del usuario cuando hay partidas', async () => {
        render(<Historic />)

        await waitFor(() => {
            expect(screen.getByText('random_bot')).toBeInTheDocument()
            expect(screen.getByText('invitado')).toBeInTheDocument()
        })
        
        // Acotamos la busqueda a la tabla
        const tabla = screen.getByRole('table');
        expect(within(tabla).getByText('✅ Victoria')).toBeInTheDocument()
        expect(within(tabla).getByText('❌ Derrota')).toBeInTheDocument()
    })

    test('muestra mensaje cuando no hay partidas registradas', async () => {
        vi.mocked(getHistory).mockResolvedValue([])
        render(<Historic />)

        await waitFor(() => {
            expect(screen.getByText(/no tienes partidas registradas/i)).toBeInTheDocument()
        })
    })

    test('muestra mensaje de sesión si no hay usuario logueado', () => {
        localStorage.clear()
        render(<Historic />)
        expect(screen.getByText(/debes iniciar sesión/i)).toBeInTheDocument()
    })

    test('muestra error si getHistory falla', async () => {
        vi.mocked(getHistory).mockRejectedValue(new Error('Error del servidor'))
        render(<Historic />)

        await waitFor(() => {
            expect(screen.getByText(/error del servidor/i)).toBeInTheDocument()
        })
    })

    test('filtra por resultado al cambiar el selector', async () => {
        const user = userEvent.setup()
        render(<Historic />)
        await waitFor(() => expect(screen.getByText('random_bot')).toBeInTheDocument())

        // El primer select es el de resultado, el segundo el de tamaño
        const [selectResultado] = screen.getAllByRole('combobox')
        await user.selectOptions(selectResultado, '1')

        await waitFor(() => {
            expect(getHistory).toHaveBeenLastCalledWith('testuser', expect.objectContaining({ resultado: '1' }))
        })
    })
    test('filtra por rival al escribir y pulsar Buscar', async () => {
        const user = userEvent.setup()
        render(<Historic />)
        await waitFor(() => expect(screen.getByText('random_bot')).toBeInTheDocument())

        const input = screen.getByPlaceholderText(/buscar rival/i)
        await user.type(input, 'random_bot')
        await user.click(screen.getByRole('button', { name: /buscar/i }))

        await waitFor(() => {
            expect(getHistory).toHaveBeenLastCalledWith('testuser', expect.objectContaining({ rival: 'random_bot' }))
        })
    })

    test('buscar rival también se activa con Enter', async () => {
        const user = userEvent.setup()
        render(<Historic />)
        await waitFor(() => expect(screen.getByText('random_bot')).toBeInTheDocument())

        const input = screen.getByPlaceholderText(/buscar rival/i)
        await user.type(input, 'invitado{Enter}')

        await waitFor(() => {
            expect(getHistory).toHaveBeenLastCalledWith('testuser', expect.objectContaining({ rival: 'invitado' }))
        })
    })

    test('el botón Limpiar filtros resetea todos los filtros', async () => {
        const user = userEvent.setup()
        render(<Historic />)
        await waitFor(() => expect(screen.getByText('random_bot')).toBeInTheDocument())

        // Activamos un filtro para que aparezca el botón de limpiar
        const selects = screen.getAllByRole('combobox')
        await user.selectOptions(selects[0], '1')

        const limpiarBtn = await screen.findByRole('button', { name: /limpiar/i })
        await user.click(limpiarBtn)

        await waitFor(() => {
            // Tras limpiar, la llamada no debe llevar filtros
            expect(getHistory).toHaveBeenLastCalledWith('testuser', {})
        })
    })

    test('muestra el tamaño del tablero en formato NxN', async () => {
        render(<Historic />)

        await waitFor(() => {
            expect(screen.getByText('7x7')).toBeInTheDocument()
            expect(screen.getByText('11x11')).toBeInTheDocument()
        })
    })
})
