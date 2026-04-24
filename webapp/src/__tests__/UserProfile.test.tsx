import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom'; // Necesario para .toBeInTheDocument()

import UserProfile from '../components/UserProfile'; // Ajusta la ruta si es necesario

describe('UserProfile Component', () => {
    // Definimos un usuario de prueba (mock) con los datos que espera la interfaz
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

        // Comprobamos que el nombre y las estadísticas se pintan en pantalla
        expect(screen.getByText('testPlayer')).toBeInTheDocument();
        expect(screen.getByText(/10 partidas/i)).toBeInTheDocument();
        expect(screen.getByText(/7 victorias/i)).toBeInTheDocument();
        expect(screen.getByText(/70% win rate/i)).toBeInTheDocument();
        
        // Por defecto action es 'none', así que no debería haber botón
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

        // Comprobamos que el texto del botón es el del caso 'agregar'
        const button = screen.getByRole('button', { name: /➕ Agregar amigo/i });
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveClass('remove'); // No debe tener la clase roja

        // Simulamos el click
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

        // Comprobamos que el texto es de remover
        const button = screen.getByRole('button', { name: /➖ Remover amigo/i });
        expect(button).toBeInTheDocument();
        
        // Debe tener la clase 'remove' para pintarse de rojo (según tu className)
        expect(button).toHaveClass('remove');

        // Simulamos el click
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

        // El texto debería ser el personalizado, ignorando el switch case de 'agregar'
        const button = screen.getByRole('button', { name: /Aceptar solicitud/i });
        expect(button).toBeInTheDocument();
    });

    test('5. No renderiza botón si onAction no se proporciona (aunque haya action)', () => {
        render(
            <UserProfile 
                user={mockUser} 
                action="agregar" 
                // Omitimos onAction a propósito
            />
        );

        // La condición {action !== 'none' && onAction && ...} debería ocultar el botón
        const button = screen.queryByRole('button');
        expect(button).not.toBeInTheDocument();
    });
});