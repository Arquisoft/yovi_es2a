import '../styles/App.css';
import '../styles/Game.css';
import { GameBoard } from '../components/gameBoard/GameBoard';
import { EndGameOverlay as Overlay } from '../components/gameBoard/EndGameOverlay';
import { useGame } from '../hooks/useGame';
import { useNavigate } from 'react-router-dom';

interface GameProps {
    size?: number;
    mode?: "human" | "computer";
    botId?: string;
}

// Aquí se le deberían pasar las opciones de juego
export function Game({ size = 7, mode = "computer", botId = "random_bot" }: GameProps): JSX.Element {
    const username = localStorage.getItem("username") ?? undefined;
    const navigate = useNavigate();
    const { cells, currentPlayer, winner, status, error, handleCellClick, handleResign, resetGame } = useGame({ size, mode, botId, username });

    if (status === "loading") return <div>Cargando partida...</div>;

    if (username == null) {
        navigate('/');;
    }
    return (
        <>
            {status === "finished" && <Overlay winner={winner} onResetClick={resetGame} />}

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

            <div className="user-info">
                <p>Jugador Loggeado: {username}</p>
            </div>
        </>    
    );
}

export default Game;
