import "./EndGameOverlay.css";

interface EndGameOverlayProps {
    winner: string | null;
    onResetClick: () => void;
    onMenuClick: () => void;
}

export function EndGameOverlay({ winner, onResetClick, onMenuClick }: EndGameOverlayProps): JSX.Element {
    return (
        <div className="overlay-content">
            {winner === "PLAYER_ONE" ? (
                <h1 className="overlay-content-message winner">¡Has ganado!</h1>
            ) : (
                <h1 className="overlay-content-message loser">¡Has perdido!</h1>
            )}
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