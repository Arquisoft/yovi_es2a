import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import SearchUsers from '../components/SearchUsers'; 
import { searchUsers, addFriend } from '../services/gameService';

vi.mock('../services/gameService', () => ({
    searchUsers: vi.fn(),
    addFriend: vi.fn(),
}));

vi.mock('../components/UserProfile', () => ({
    default: ({ user, onAction }: any) => (
        <div data-testid={`mock-user-profile-${user.username}`}>
            <span>{user.username}</span>
            <button onClick={onAction}>Agregar</button>
        </div>
    )
}));

describe('Componente SearchUsers', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('username', 'MiUsuario');
    });

    it('renderiza el input y el botón correctamente', () => {
        render(<SearchUsers />);
        expect(screen.getByPlaceholderText('Buscar usuario por nombre...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    });

    it('muestra un error si se intenta buscar con el input vacío', () => {
        render(<SearchUsers />);
        const searchButton = screen.getByRole('button', { name: 'Buscar' });
        
        fireEvent.click(searchButton);
        
        expect(screen.getByText('Ingresa un nombre de usuario')).toBeInTheDocument();
        expect(searchUsers).not.toHaveBeenCalled();
    });

    it('busca usuarios y excluye al usuario actual de los resultados', async () => {
        (searchUsers as any).mockResolvedValue([
            { username: 'Amigo1', stats: {} },
            { username: 'MiUsuario', stats: {} }
        ]);

        render(<SearchUsers />);
        
        const input = screen.getByPlaceholderText('Buscar usuario por nombre...');
        const searchButton = screen.getByRole('button', { name: 'Buscar' });

        fireEvent.change(input, { target: { value: 'Amigo' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByTestId('mock-user-profile-Amigo1')).toBeInTheDocument();
            expect(screen.queryByTestId('mock-user-profile-MiUsuario')).not.toBeInTheDocument();
        });
    });

    it('muestra un mensaje si la búsqueda no encuentra a nadie (después de filtrar)', async () => {
        (searchUsers as any).mockResolvedValue([{ username: 'MiUsuario', stats: {} }]);

        render(<SearchUsers />);
        
        fireEvent.change(screen.getByPlaceholderText('Buscar usuario por nombre...'), { target: { value: 'MiUsuario' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

        await waitFor(() => {
            expect(screen.getByText('No se encontraron usuarios con ese nombre')).toBeInTheDocument();
        });
    });

    it('muestra un mensaje de error si la llamada a la API falla', async () => {
        (searchUsers as any).mockRejectedValue(new Error('Backend caído'));

        render(<SearchUsers />);
        
        fireEvent.change(screen.getByPlaceholderText('Buscar usuario por nombre...'), { target: { value: 'ErrorTest' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

        await waitFor(() => {
            expect(screen.getByText('Backend caído')).toBeInTheDocument();
        });
    });

    it('llama a addFriend y elimina al usuario de la lista al agregarlo con éxito', async () => {
        const mockOnUserAdded = vi.fn();
        (searchUsers as any).mockResolvedValue([{ username: 'NuevoAmigo', stats: {} }]);
        (addFriend as any).mockResolvedValue({}); 

        render(<SearchUsers onUserAdded={mockOnUserAdded} />);
        
        fireEvent.change(screen.getByPlaceholderText('Buscar usuario por nombre...'), { target: { value: 'NuevoAmigo' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

        await waitFor(() => {
            expect(screen.getByTestId('mock-user-profile-NuevoAmigo')).toBeInTheDocument();
        });

        const addButton = screen.getByRole('button', { name: 'Agregar' });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(addFriend).toHaveBeenCalledWith('NuevoAmigo'); 
            expect(mockOnUserAdded).toHaveBeenCalledTimes(1);
            expect(screen.queryByTestId('mock-user-profile-NuevoAmigo')).not.toBeInTheDocument(); 
        });
    });
});