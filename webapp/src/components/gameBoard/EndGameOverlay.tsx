import "./EndGameOverlay.css";

interface EndGameOverlayProps {
    winner: string | null;
    onResetClick: () => void;
}

export function EndGameOverlay({ winner, onResetClick }: EndGameOverlayProps): JSX.Element {
    return (
        <div className="overlay-content">
            {winner === "PLAYER_ONE" ? <h1 className="overlay-content-message winner">¡Has ganado!</h1> : <h1 className="overlay-content-message loser">¡Has perdido!</h1>}
            <div className="overlay-buttons">
                <button className="overlay-button reset-button" onClick={onResetClick}>Volver a jugar</button>
                {/*Cuando se haga el menú principal cambiar esto*/ }
                <button className="overlay-button main-menu-button" disabled>Volver al menú</button>
            </div>
        </div>
    );
}