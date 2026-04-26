import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // <--- SOLUCIÓN ERROR 1: Permite usar toBeInTheDocument

import FriendsList from '../components/FriendsList'; 
import { getFriends } from '../services/gameService'; 


vi.mock('../services/gameService', () => ({
    getFriends: vi.fn(),
    removeFriend: vi.fn(),
}));

vi.mock('../UserProfile', () => ({
    default: ({ user, action, onAction }: any) => (
        <div data-testid={`user-profile-${user.username}`}>
            <span>{user.username}</span>
            <button onClick={onAction}>{action}</button>
        </div>
    )
}));

const mockGetItem = vi.fn();
Object.defineProperty(global, 'localStorage', {
    value: { getItem: mockGetItem },
    writable: true
});


describe('FriendsList Component', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('muestra mensaje si el usuario no está autenticado', () => {
        mockGetItem.mockReturnValue(null); 

        render(<FriendsList />);

        expect(screen.getByText(/Debes iniciar sesión/i)).toBeInTheDocument();
    });

    test('muestra estado de carga y luego lista vacía si no tiene amigos', async () => {
        mockGetItem.mockReturnValue('iyan2');
        (getFriends as any).mockResolvedValueOnce([]); 

        render(<FriendsList />);

        expect(screen.getByText(/Cargando amigos/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Todavía no tienes amigos/i)).toBeInTheDocument();
        });
    });

    test('muestra mensaje de error si falla la carga de amigos desde el servidor', async () => {
        mockGetItem.mockReturnValue('iyan2');
        (getFriends as any).mockRejectedValueOnce(new Error('Fallo de conexión'));

        render(<FriendsList />);

        await waitFor(() => {
            expect(screen.getByText(/Error: Fallo de conexión/i)).toBeInTheDocument();
        });
    });

});