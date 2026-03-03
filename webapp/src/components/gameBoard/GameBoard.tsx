import "./GameBoard.css";
import { TableCell } from "./Cell";
import { useGame } from "../../hooks/useGame";

interface GameBoardProps {
    size: number;
    mode: "human" | "computer";
}

// Función que crea el componente del tablero de juego
export function GameBoard({ size = 7, mode = "human" }: GameBoardProps): JSX.Element {

    const { cells, currentPlayer, winner, status, error, handleCellClick, handleResign, resetGame } = useGame({ size, mode });

    if (status === "loading") return <div>Cargando partida...</div>;

    return (
        <div>
            <div className="game-info">
                {winner
                    ? <p>¡Ganador: {winner}!</p>
                    : <p>Turno: {currentPlayer}</p>
                }
                {error && <p className="error">{error}</p>}
                <button onClick={handleResign} disabled={status !== "ongoing"}>Rendirse</button>
                <button onClick={resetGame}>Nueva partida</button>
            </div>
        
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
        </div>
    );
}