import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom'; // <--- SOLUCIÓN ERROR 1: Permite usar toBeInTheDocument

// Ajustamos las rutas asumiendo que el test está en src/__tests__ 
// y el componente en src/ o src/components/
import FriendsList from '../components/FriendsList'; 
import { getFriends, removeFriend } from '../services/gameService'; 

// ─── 1. MOCKS DE DEPENDENCIAS ──────────────────────────────────────────────

// SOLUCIÓN ERRORES 2-6: Aseguramos que la ruta del mock sea idéntica a la del import
vi.mock('../services/gameService', () => ({
    getFriends: vi.fn(),
    removeFriend: vi.fn(),
}));

// Mock del componente hijo UserProfile para aislar el test
vi.mock('../UserProfile', () => ({
    default: ({ user, action, onAction }: any) => (
        <div data-testid={`user-profile-${user.username}`}>
            <span>{user.username}</span>
            <button onClick={onAction}>{action}</button>
        </div>
    )
}));

// Mock del LocalStorage
const mockGetItem = vi.fn();
Object.defineProperty(global, 'localStorage', {
    value: { getItem: mockGetItem },
    writable: true
});

// ─── 2. BATERÍA DE TESTS ───────────────────────────────────────────────────

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
        // Forzamos el tipado para evitar quejas de TypeScript
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