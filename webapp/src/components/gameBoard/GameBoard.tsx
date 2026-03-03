import "./GameBoard.css";
import { TableCell } from "./Cell";
import type { TableCell as TableCellModel } from "../../types/game";

interface GameBoardProps {
    cells: TableCellModel[];
    size: number;
    onCellClick: (id: number) => void;
}

// Función que crea el componente del tablero de juego
export function GameBoard({ cells, size, onCellClick }: GameBoardProps): JSX.Element {

    // Si el estado es "loading" mostramos un mensaje de carga, por si tarda más de lo esperado
    if (status === "loading") return <div>Cargando partida...</div>;

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
                                    onClick={() => onCellClick(cell.id)}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
    );
}