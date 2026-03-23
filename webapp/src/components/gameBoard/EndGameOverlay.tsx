import "./EndGameOverlay.css";

interface EndGameOverlayProps {
    winner: string | null;
    onResetClick: () => void;
    onMenuClick: () => void;
    username: string; 
    rival: string;
}

export function EndGameOverlay({ winner, onResetClick, onMenuClick, rival, username }: EndGameOverlayProps): JSX.Element {
    let mensaje = "";

    if (winner === "PLAYER_ONE") {
        // Victoria del usuario logueado
        mensaje = `Victoria jugador ${username || "1"}`;
    } else if (winner === "PLAYER_TWO") {
        // Victoria del oponente (Nombre del Bot o nombre del Rival)
        mensaje = `Victoria jugador ${rival}`;
    } else {
        mensaje = "¡Empate!";
    }

    return (
        <div className="overlay-content">
            <h1 className={`overlay-content-message ${winner === "PLAYER_ONE" ? "winner" : "loser"}`}>
                {mensaje}
            </h1>
            <div className="overlay-buttons">
                <button className="overlay-button reset-button" onClick={onResetClick}>
                    Volver a jugar
                </button>
                <button className="overlay-button" onClick={onMenuClick}>
                    Volver al menú
                </button>
            </div>
        </div>
    );
}