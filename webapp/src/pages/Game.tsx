import { useEffect } from 'react';
import '../styles/App.css';
import '../styles/Game.css';
import { GameBoard } from '../components/gameBoard/GameBoard';
import { EndGameOverlay as Overlay } from '../components/gameBoard/EndGameOverlay';
import { useGame } from '../hooks/useGame';
import { useNavigate, useLocation } from 'react-router-dom';

interface GameProps {
    size?: number;
    mode?: "human" | "computer";
    botId?: string;
}

export function Game({ size: _size }: GameProps): JSX.Element {
    const username = localStorage.getItem("username") ?? undefined;
    const navigate = useNavigate();
    const location = useLocation();

    // Leemos el modo, botId y boardSize del state que viene desde el Lobby
    const mode: "human" | "computer" = location.state?.mode ?? "computer";
    const botId: string = location.state?.botId ?? "random_bot";

    // El tamaño del tablero es el que viene del Lobby, o el prop, o 7
    const boardSize: number = location.state?.boardSize ?? 7;
    const size = boardSize ?? _size ?? 7;


    const { cells, currentPlayer, winner, status, error, handleCellClick, handleResign, resetGame } = useGame({ size, mode, botId, username });

    const volverAlMenu = () => {
        navigate('/lobby'); 
    };

    // Navegación segura usando useEffect para evitar warnings de React
    useEffect(() => {
        if (username == null) {
            navigate('/');
        }
    }, [username, navigate]);

    if (status === "loading") return <div>Cargando partida...</div>;

    return (
        <>
            {status === "finished" && <Overlay winner={winner} onResetClick={resetGame} onMenuClick={volverAlMenu} />}

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
