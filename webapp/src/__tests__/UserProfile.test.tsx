import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom'; 

import UserProfile from '../components/UserProfile'; 

describe('UserProfile Component', () => {
    const mockUser = {
        username: 'testPlayer',
        stats: {
            total: 10,
            wins: 7,
            losses: 3,
            winRate: 70,
            currentStreak: 2,
            bestStreak: 5,
            mostPlayedRival: 'random_bot',
            rivalStats: {}
        }
    };

    test('1. Renderiza correctamente la información básica del usuario', () => {
        render(<UserProfile user={mockUser} />);

        expect(screen.getByText('testPlayer')).toBeInTheDocument();
        expect(screen.getByText(/10 partidas/i)).toBeInTheDocument();
        expect(screen.getByText(/7 victorias/i)).toBeInTheDocument();
        expect(screen.getByText(/70% win rate/i)).toBeInTheDocument();
        
        const button = screen.queryByRole('button');
        expect(button).not.toBeInTheDocument();
    });

    test('2. Muestra el botón de "Agregar" y lanza el evento al hacer click', async () => {
        const user = userEvent.setup();
        const onActionMock = vi.fn();

        render(
            <UserProfile 
                user={mockUser} 
                action="agregar" 
                onAction={onActionMock} 
            />
        );

        const button = screen.getByRole('button', { name: /➕ Agregar amigo/i });
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveClass('remove'); 

        await user.click(button);
        expect(onActionMock).toHaveBeenCalledTimes(1);
    });

    test('3. Muestra el botón de "Remover", tiene la clase correcta y lanza evento', async () => {
        const user = userEvent.setup();
        const onActionMock = vi.fn();

        render(
            <UserProfile 
                user={mockUser} 
                action="remover" 
                onAction={onActionMock} 
            />
        );

        const button = screen.getByRole('button', { name: /➖ Remover amigo/i });
        expect(button).toBeInTheDocument();
        
        expect(button).toHaveClass('remove');

        await user.click(button);
        expect(onActionMock).toHaveBeenCalledTimes(1);
    });

    test('4. Utiliza actionLabel personalizado si se proporciona', () => {
        const onActionMock = vi.fn();

        render(
            <UserProfile 
                user={mockUser} 
                action="agregar" 
                actionLabel="Aceptar solicitud" 
                onAction={onActionMock} 
            />
        );

        const button = screen.getByRole('button', { name: /Aceptar solicitud/i });
        expect(button).toBeInTheDocument();
    });

    test('5. No renderiza botón si onAction no se proporciona (aunque haya action)', () => {
        render(
            <UserProfile 
                user={mockUser} 
                action="agregar" 
            />
        );

        const button = screen.queryByRole('button');
        expect(button).not.toBeInTheDocument();
    });
});