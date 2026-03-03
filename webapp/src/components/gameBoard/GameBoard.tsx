import { useState } from "react";
import "./GameBoard.css";
import { TableCell } from "./Cell";
import type { TableCell as TableCellModel } from "../../types/game";

interface GameBoardProps {
    size: number;
}

// Función que crea el componente del tablero de juego
export function GameBoard({ size }: GameBoardProps): JSX.Element {

    /*
     * Hook de estado. Se le pasa como param el estado incial: el tablero de casillas vacio 
     */
    const [cells, setCells] = useState<TableCellModel[]>(() => {
        const temp: TableCellModel[] = [];
        let id = 0;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col <= row; col++) {
                const x = size - 1 - row;
                const y = col;
                const z = (size-1) - x - y;
                temp.push({ id, x, y, z, owner: null });
                id++;
            }
        }
        return temp;
    });

    // Evento de haccer click a una
    const handleCellClick = (id: number) => {
        setCells(prev =>
            prev.map(cell =>
                cell.id === id ? { ...cell, owner: "PLAYER_ONE" } : cell
            )
        );
    };

    
    return (
        <div className="game-board">
            {Array.from({ length: size }).map((_, rowIndex) => {
                const rowCells = cells.filter(cell => cell.x + cell.y === rowIndex);

                // Desplazamiento para centrar el triángulo:
                // fila 0 → máximo desplazamiento a la derecha
                // última fila → sin desplazamiento (alineada a la izquierda)

                return (
                    <div
                        key={rowIndex}
                        className="row"
                    >
                        {rowCells.map(cell => (
                            <TableCell
                                key={cell.id}
                                {...cell}
                                onClick={handleCellClick}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}