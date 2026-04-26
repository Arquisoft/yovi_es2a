import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom'; 
import { TableCell } from '../components/gameBoard/Cell';

const mockPlayer1 = "Player1" as any;
const mockPlayer2 = "Player2" as any

describe('Componente TableCell', () => {

    it('renderiza correctamente una celda vacía', () => {
        const mockOnClick = vi.fn();
        render(<TableCell id={1} x={0} y={0} z={0} owner={null} onClick={mockOnClick} />);
        
        const cell = screen.getByRole('button', { name: /Casilla 1/i });
        expect(cell).toBeInTheDocument();
        expect(cell).toHaveClass('table-cell empty');
    });

    it('renderiza correctamente una celda con dueño', () => {
        const mockOnClick = vi.fn();
        render(<TableCell id={2} x={1} y={0} z={-1} owner={mockPlayer1} onClick={mockOnClick} />);
        
        const cell = screen.getByRole('button', { name: /Casilla 2/i });
        expect(cell).toHaveClass('table-cell player1');
    });

    it('llama a onClick al hacer clic si la celda está vacía', () => {
        const mockOnClick = vi.fn();
        render(<TableCell id={3} x={0} y={1} z={-1} owner={null} onClick={mockOnClick} />);
        
        const cell = screen.getByRole('button', { name: /Casilla 3/i });
        fireEvent.click(cell);
        
        expect(mockOnClick).toHaveBeenCalledTimes(1);
        expect(mockOnClick).toHaveBeenCalledWith(3);
    });

    it('NO llama a onClick al hacer clic si la celda ya tiene dueño', () => {
        const mockOnClick = vi.fn();
        render(<TableCell id={4} x={0} y={0} z={0} owner={mockPlayer2} onClick={mockOnClick} />);
        
        const cell = screen.getByRole('button', { name: /Casilla 4/i });
        fireEvent.click(cell);
        
        expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('llama a onClick al presionar la tecla Enter o Espacio', () => {
        const mockOnClick = vi.fn();
        render(<TableCell id={5} x={-1} y={1} z={0} owner={null} onClick={mockOnClick} />);
        
        const cell = screen.getByRole('button', { name: /Casilla 5/i });
        
        fireEvent.keyDown(cell, { key: 'Enter' });
        expect(mockOnClick).toHaveBeenCalledTimes(1);
        
        fireEvent.keyDown(cell, { key: ' ' });
        expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
});