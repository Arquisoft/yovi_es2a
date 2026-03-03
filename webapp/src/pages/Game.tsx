import '../styles/App.css';
import '../styles/Game.css';
import { GameBoard } from '../components/gameBoard/GameBoard';
import { useGame } from '../hooks/useGame';

interface GameProps {
    size?: number;
    mode?: "human" | "computer";
    botId?: string;
}

export function Game({ size = 7, mode = "computer", botId = "random_bot" }: GameProps): JSX.Element {

    const { cells, currentPlayer, winner, status, error, handleCellClick, handleResign, resetGame } = useGame({ size, mode, botId });

    if (status === "loading") return <div>Cargando partida...</div>;

    return (
        <>
            {/* Overlay de fin de partida */}
            {status === "finished" && (
                <div className="overlay">
                    <div className="overlay-content">
                        <h1>{winner === "PLAYER_ONE" ? "¡Has ganado!" : "¡Has perdido!"}</h1>
                        <button onClick={resetGame}>Volver a jugar</button>
                        <button disabled>Volver al menú</button>
                    </div>
                </div>
            )}

            <div className="game-container">

                {/* Tablero */}
                <GameBoard
                    cells={cells}
                    size={size}
                    onCellClick={handleCellClick}
                />
                
                {/* Info de la partida */}
                <div className="game-info">
                    {winner
                        ? <p>TERMINADO</p>
                        : <p>Turno: {currentPlayer}</p>
                    }
                    {error && <p className="error">{error}</p>}
                    <button className="game-surrenter-button" onClick={handleResign} disabled={status !== "ongoing"}>
                        Rendirse
                    </button>
                </div>
            </div>
        </>    
    );
}

export default Game;
