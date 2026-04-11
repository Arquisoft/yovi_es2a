// Tests de la venana principal del menú
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock para comprobar la navegación
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('../components/AuthComprobation', () => ({
    useAuthComprobation: vi.fn(),
}))

vi.mock('../components/Navbar', () => ({
    default: () => <nav data-testid="navbar" />,
}))

import Menu from '../pages/Menu'
import { MemoryRouter } from 'react-router-dom'

describe('Menu', () => {
    afterEach(() => vi.clearAllMocks())

    const renderMenu = () =>
        render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        )

// -------------------------TESTS -------------------------

    test('muestra el título y las dos opciones principales', () => {
        renderMenu()
        expect(screen.getByText('MENU')).toBeInTheDocument()
        expect(screen.getByText('Jugar')).toBeInTheDocument()
        expect(screen.getByText('Ver datos')).toBeInTheDocument()
    })

    test('el botón Jugar navega a /lobby', async () => {
        const user = userEvent.setup()
        renderMenu()

        await user.click(screen.getByText('Jugar'))
        expect(mockNavigate).toHaveBeenCalledWith('/lobby')
    })

    test('el botón Ver datos navega a /datos', async () => {
        const user = userEvent.setup()
        renderMenu()

        await user.click(screen.getByText('Ver datos'))
        expect(mockNavigate).toHaveBeenCalledWith('/datos')
    })

    test('la barra de navegación está presente', () => {
        renderMenu()
        expect(screen.getByTestId('navbar')).toBeInTheDocument()
    })
})
