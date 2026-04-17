import '../styles/App.css';
import '../styles/Game.css';
import { GameBoard } from '../components/gameBoard/GameBoard';
import { EndGameOverlay as Overlay } from '../components/gameBoard/EndGameOverlay';
import { useGame } from '../hooks/useGame';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthComprobation, getLoggedUser } from '../components/AuthComprobation';
import Navbar from '../components/Navbar';
import { useEffect, useState, useRef } from 'react';
interface GameProps {
    size?: number;
    mode?: "human" | "computer";
    botId?: string;
}

export function Game({ size: _size }: GameProps): JSX.Element {
    useAuthComprobation();
    const navigate = useNavigate();
    const location = useLocation();

    // Leemos el modo, botId y boardSize del state que viene desde el Lobby
    const mode: "human" | "computer" = location.state?.mode ?? "computer";
    const botId: string = location.state?.botId ?? "random_bot";

    const timerDuration: number | null = location.state?.timer ?? null; // <-- NUEVO

    // El tamaño del tablero es el que viene del Lobby, o el prop, o 7
    const boardSize: number = location.state?.boardSize ?? 7;
    const size = boardSize ?? _size ?? 7;

    const username = localStorage.getItem("username") ?? undefined;
    const { cells, currentPlayer, winner, status, error, handleCellClick, handleResign, handleTimeout, resetGame, moveCount } = useGame({ size, mode, botId, username, timer: timerDuration });   
    
    // --- NUEVO: Lógica del Reloj a Prueba de Bots ---
    const [timeLeft, setTimeLeft] = useState<number | null>(timerDuration);
    
    // AHORA TRACKEAMOS EL NUMERO DE MOVIMIENTO, NO EL JUGADOR
    const [trackedMove, setTrackedMove] = useState<number>(moveCount); 
    const isTimeoutProcessing = useRef(false);

    // Si el número de movimiento cambia, reiniciamos reloj
    if (moveCount !== trackedMove) {
        setTrackedMove(moveCount);
        if (timerDuration && status === "ongoing") {
            setTimeLeft(timerDuration);
        } else {
            setTimeLeft(null);
        }
        isTimeoutProcessing.current = false;
    }

    useEffect(() => {
        if (timeLeft === null || status !== "ongoing") return;

        if (timeLeft === 0) {
            if (!isTimeoutProcessing.current) {
                isTimeoutProcessing.current = true;
                handleTimeout(); 
            }
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, status, handleTimeout]);


    const volverAlMenu = () => {
        navigate('/lobby'); 
    };

    if (status === "loading") return <div>Cargando partida...</div>;

    return (
        <>
            <Navbar />
            {status === "finished" && <Overlay 
                                winner={winner} 
                                onResetClick={resetGame} 
                                onMenuClick={volverAlMenu} 
                                username={username ?? "Jugador 1"} 
                                rival={mode === "computer" ? botId : (location.state?.rival || "Jugador 2")}
            />}

            <div className="game-container">
                {/* Tablero */}
                <GameBoard
                    cells={cells}
                    size={size}
                    onCellClick={handleCellClick}
                />
                
                {/* Info de la partida */}
                <div className="game-info">
                    {/* --- NUEVO: Reloj Visual --- */}
                    {timeLeft !== null && status === "ongoing" && (
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: timeLeft <= 5 ? 'red' : 'inherit', marginBottom: '10px' }}>
                            ⏳ {timeLeft}s
                        </div>
                    )}

                    {winner
                        ? <p>TERMINADO</p>
                        : <p>Turno: {currentPlayer}</p>
                    }
                    {error && <p className="error">{error}</p>}
                    <button className="game-surrender-button" onClick={handleResign} disabled={status !== "ongoing"}>
                        Rendirse
                    </button>
                </div>
            </div>

            <div className="user-info">
                <p>Jugador Loggeado: {getLoggedUser()}</p>
            </div>
        </>    
    );
}

export default Game;