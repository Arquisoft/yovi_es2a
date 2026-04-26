// Tests del componente BrowseGroups
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock de los servicios
const mockGetGroups = vi.fn()
const mockGetMyGroups = vi.fn()
const mockJoinGroup = vi.fn()
const mockCreateGroup = vi.fn()

vi.mock('../services/gameService', () => ({
    getGroups: (...args: any[]) => mockGetGroups(...args),
    getMyGroups: (...args: any[]) => mockGetMyGroups(...args),
    joinGroup: (...args: any[]) => mockJoinGroup(...args),
    createGroup: (...args: any[]) => mockCreateGroup(...args),
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom')
    return {
        ...actual,
    }
})

import BrowseGroups from '../components/BrowseGroups'

describe('BrowseGroups', () => {
    beforeEach(() => {
        localStorage.setItem('username', 'testuser')
        vi.clearAllMocks()
    })

    afterEach(() => {
        localStorage.clear()
    })

    const mockGroups = [
        { _id: '1', name: 'Grupo A', description: 'Descripción A', members: ['user1', 'user2'] },
        { _id: '2', name: 'Grupo B', description: 'Descripción B', members: ['user3'] },
        { _id: '3', name: 'Grupo C', description: '', members: [] },
    ]

    test('renderiza mensaje de autenticación cuando no hay usuario', () => {
        localStorage.clear()
        render(<BrowseGroups />)
        expect(screen.getByText(/debes iniciar sesión/i)).toBeInTheDocument()
    })

    test('renderiza mensaje de carga inicialmente', () => {
        mockGetGroups.mockImplementation(() => new Promise(() => {}))
        mockGetMyGroups.mockImplementation(() => new Promise(() => {}))
        
        render(<BrowseGroups />)
        expect(screen.getByText(/cargando grupos/i)).toBeInTheDocument()
    })

    test('carga y muestra grupos correctamente', async () => {
        mockGetGroups.mockResolvedValue(mockGroups)
        mockGetMyGroups.mockResolvedValue([{ _id: '1', name: 'Grupo A', description: 'Descripción A', members: ['user1'] }])
        
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getByText('Grupo A')).toBeInTheDocument()
            expect(screen.getByText('Grupo B')).toBeInTheDocument()
            expect(screen.getByText('Grupo C')).toBeInTheDocument()
        })
    })

    test('muestra mensaje cuando no hay grupos disponibles', async () => {
        mockGetGroups.mockResolvedValue([])
        mockGetMyGroups.mockResolvedValue([])
        
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getByText(/no hay grupos disponibles/i)).toBeInTheDocument()
        })
    })

    test('muestra botón para crear nuevo grupo', async () => {
        mockGetGroups.mockResolvedValue([])
        mockGetMyGroups.mockResolvedValue([])
        
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getByText(/crear nuevo grupo/i)).toBeInTheDocument()
        })
    })

    test('al hacer clic en crear grupo muestra el formulario', async () => {
        mockGetGroups.mockResolvedValue([])
        mockGetMyGroups.mockResolvedValue([])
        
        const user = userEvent.setup()
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getByText(/crear nuevo grupo/i)).toBeInTheDocument()
        })
        
        await user.click(screen.getByText(/crear nuevo grupo/i))
        
        // Usar placeholder en lugar de label ya que los labels no tienen for attribute
        expect(screen.getByPlaceholderText('Ej: Jugadores Avanzados')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Describe el propósito del grupo...')).toBeInTheDocument()
    })

    test('puede cancelar la creación de grupo', async () => {
        mockGetGroups.mockResolvedValue([])
        mockGetMyGroups.mockResolvedValue([])
        
        const user = userEvent.setup()
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getByText(/crear nuevo grupo/i)).toBeInTheDocument()
        })
        
        await user.click(screen.getByText(/crear nuevo grupo/i))
        await user.click(screen.getByText(/cancelar/i))
        
        expect(screen.getByText(/crear nuevo grupo/i)).toBeInTheDocument()
    })

    test('crea grupo exitosamente', async () => {
        mockGetGroups
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ _id: '4', name: 'Nuevo Grupo', description: 'Nueva Desc', members: ['testuser'] }])
        mockGetMyGroups
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ _id: '4', name: 'Nuevo Grupo', description: 'Nueva Desc', members: ['testuser'] }])
        mockCreateGroup.mockResolvedValue(undefined)
        
        const user = userEvent.setup()
        const onGroupJoined = vi.fn()
        render(<BrowseGroups onGroupJoined={onGroupJoined} />)
        
        await waitFor(() => {
            expect(screen.getByText(/crear nuevo grupo/i)).toBeInTheDocument()
        })
        
        await user.click(screen.getByText(/crear nuevo grupo/i))
        
        await user.type(screen.getByPlaceholderText('Ej: Jugadores Avanzados'), 'Nuevo Grupo')
        await user.type(screen.getByPlaceholderText('Describe el propósito del grupo...'), 'Nueva Desc')
        
        await user.click(screen.getByText(/✅ crear/i))
        
        await waitFor(() => {
            expect(mockCreateGroup).toHaveBeenCalledWith('Nuevo Grupo', 'Nueva Desc')
        })
    })

    test('muestra error cuando el nombre del grupo está vacío', async () => {
        mockGetGroups.mockResolvedValue([])
        mockGetMyGroups.mockResolvedValue([])
        
        const user = userEvent.setup()
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getByText(/crear nuevo grupo/i)).toBeInTheDocument()
        })
        
        await user.click(screen.getByText(/crear nuevo grupo/i))
        await user.click(screen.getByText(/✅ crear/i))
        
        expect(screen.getByText(/el nombre del grupo es requerido/i)).toBeInTheDocument()
    })

    test('unirse a un grupo exitosamente', async () => {
        mockGetGroups.mockResolvedValue(mockGroups)
        mockGetMyGroups.mockResolvedValue([])
        mockJoinGroup.mockResolvedValue(undefined)
        
        const user = userEvent.setup()
        const onGroupJoined = vi.fn()
        render(<BrowseGroups onGroupJoined={onGroupJoined} />)
        
        await waitFor(() => {
            expect(screen.getAllByText('Grupo A')[0] || screen.getByText((_, element) => 
                element?.textContent === 'Grupo A')).toBeInTheDocument()
        })
        
        // Buscar botón de unirse por su texto
        const joinButtons = screen.getAllByText(/unirse/i)
        await user.click(joinButtons[0])
        
        await waitFor(() => {
            expect(mockJoinGroup).toHaveBeenCalledWith('1')
        })
    })

    test('maneja error al cargar grupos', async () => {
        mockGetGroups.mockRejectedValue(new Error('Error de red'))
        mockGetMyGroups.mockResolvedValue([])
        
        render(<BrowseGroups />)
        
        expect(await screen.findByText('Error de red')).toBeInTheDocument()
    })

    test('maneja error al unirse a un grupo', async () => {
        mockGetGroups.mockResolvedValue(mockGroups)
        mockGetMyGroups.mockResolvedValue([])
        mockJoinGroup.mockRejectedValue(new Error('Error al unirse'))
        
        const user = userEvent.setup()
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getAllByText('Grupo A').length).toBeGreaterThan(0)
        })
        
        const joinButtons = screen.getAllByText(/unirse/i)
        await user.click(joinButtons[0])
        
        expect(await screen.findByText('Error al unirse')).toBeInTheDocument()
    })

    test('maneja error al crear grupo', async () => {
        mockGetGroups.mockResolvedValue([])
        mockGetMyGroups.mockResolvedValue([])
        mockCreateGroup.mockRejectedValue(new Error('Error al crear'))
        
        const user = userEvent.setup()
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getByText(/crear nuevo grupo/i)).toBeInTheDocument()
        })
        
        await user.click(screen.getByText(/crear nuevo grupo/i))
        await user.type(screen.getByPlaceholderText('Ej: Jugadores Avanzados'), 'Nuevo Grupo')
        await user.click(screen.getByText(/✅ crear/i))
        
        expect(await screen.findByText('Error al crear')).toBeInTheDocument()
    })

    test('marca grupos a los que el usuario ya pertenece', async () => {
        mockGetGroups.mockResolvedValue(mockGroups)
        mockGetMyGroups.mockResolvedValue([
            { _id: '1', name: 'Grupo A', description: 'Descripción A', members: ['testuser'] }
        ])
        
        render(<BrowseGroups />)
        
        await waitFor(() => {
            expect(screen.getAllByText('Grupo A').length).toBeGreaterThan(0)
        })
        
        expect(screen.getByText('✓ Miembro')).toBeInTheDocument()
    })
})