import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom'; 
import { EndGameOverlay } from '../components/gameBoard/EndGameOverlay'; 

describe('Componente EndGameOverlay', () => {

    it('renderiza el mensaje de victoria para el jugador principal (con nombre)', () => {
        render(<EndGameOverlay winner="PLAYER_ONE" username="Adrian" rival="BotSupremo" onResetClick={vi.fn()} onMenuClick={vi.fn()} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Victoria jugador Adrian');
        expect(heading).toHaveClass('winner');
    });

    it('renderiza el mensaje de victoria para el jugador principal (sin nombre, usa "1" por defecto)', () => {
        render(<EndGameOverlay winner="PLAYER_ONE" username="" rival="BotSupremo" onResetClick={vi.fn()} onMenuClick={vi.fn()} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Victoria jugador 1');
    });

    it('renderiza el mensaje de victoria para el rival', () => {
        render(<EndGameOverlay winner="PLAYER_TWO" username="Adrian" rival="BotSupremo" onResetClick={vi.fn()} onMenuClick={vi.fn()} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Victoria jugador BotSupremo');
        expect(heading).toHaveClass('loser');
    });

    it('renderiza el mensaje de empate', () => {
        render(<EndGameOverlay winner={null} username="Adrian" rival="BotSupremo" onResetClick={vi.fn()} onMenuClick={vi.fn()} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('¡Empate!');
        expect(heading).toHaveClass('loser');
    });

    it('llama a onResetClick al pulsar el botón "Volver a jugar"', () => {
        const mockOnReset = vi.fn();
        render(<EndGameOverlay winner="PLAYER_ONE" username="Adrian" rival="Bot" onResetClick={mockOnReset} onMenuClick={vi.fn()} />);
        
        const resetBtn = screen.getByRole('button', { name: /Volver a jugar/i });
        fireEvent.click(resetBtn);
        
        expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('llama a onMenuClick al pulsar el botón "Volver al menú"', () => {
        const mockOnMenu = vi.fn();
        render(<EndGameOverlay winner="PLAYER_ONE" username="Adrian" rival="Bot" onResetClick={vi.fn()} onMenuClick={mockOnMenu} />);
        
        const menuBtn = screen.getByRole('button', { name: /Volver al menú/i });
        fireEvent.click(menuBtn);
        
        expect(mockOnMenu).toHaveBeenCalledTimes(1);
    });
});