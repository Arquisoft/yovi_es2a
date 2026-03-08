import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Historic from './Historic';
import '../styles/Lobby.css';
import '../styles/Historic.css';



type GameMode = "human" | "computer" | null;
type BotType = "random" | "defensive" | "offensive" | "positional";
type Difficulty = "easy" | "medium" | "hard";

const BOT_NAMES: Record<BotType, string> = {
    random: "Aleatorio",
    defensive: "Defensivo",
    offensive: "Ofensivo",
    positional: "Posicional",
};

const BOT_DESCRIPTIONS: Record<BotType, string> = {
    random: "Juega al azar. Perfecto para principiantes.",
    defensive: "Bloquea tus movimientos y juega seguro.",
    offensive: "Intenta ganar jugando ofensivamente.",
    positional: "Controla las posiciones clave del tablero.",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    easy: "FÁCIL",
    medium: "MEDIO",
    hard: "DIFÍCIL",
};

function getBotId(type: BotType, difficulty: Difficulty): string {
    if (type === "random") return "random_bot";
    return `${type}_${difficulty}`;
}

export default function Lobby(): JSX.Element {
    const navigate = useNavigate();
    const [mode, setMode] = useState<GameMode>(null);
    const [botType, setBotType] = useState<BotType>("random");
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [showHistory, setShowHistory] = useState(false);

    const handlePlay = () => {
        if (mode === "human") {
            navigate('/game', { state: { mode: "human" } });
        } else if (mode === "computer") {
            const botId = getBotId(botType, difficulty);
            navigate('/game', { state: { mode: "computer", botId } });
        }
    };

    return (
        <div className="lobby-container">
            <div className="lobby-card">

                {/* Botón historial arriba a la derecha */}
                <div className="lobby-header">
                    <button
                        className="history-btn"
                        onClick={() => setShowHistory(true)}
                        title="Ver historial"
                    >
                        📋 Historial
                    </button>
                </div>

                {/* Panel historial */}
                {showHistory && (
                    <div className="history-panel">
                        <div className="history-panel-header">
                            <button className="history-close-btn" onClick={() => setShowHistory(false)}>✕</button>
                        </div>
                        <Historic />
                    </div>
                )}

                <h1 className="lobby-title">ELIGE TU PARTIDA</h1>
                <p className="lobby-subtitle">¿Cómo quieres jugar?</p>

                <div className="mode-selector">
                    <button
                        className={`mode-btn ${mode === "computer" ? "active" : ""}`}
                        onClick={() => setMode("computer")}
                    >
                        <span className="mode-icon">🤖</span>
                        <span className="mode-label">vs Máquina</span>
                        <span className="mode-desc">Jugar contra la IA</span>
                    </button>
                    <button
                        className={`mode-btn ${mode === "human" ? "active" : ""}`}
                        onClick={() => setMode("human")}
                    >
                        <span className="mode-icon">👥</span>
                        <span className="mode-label">vs Humano</span>
                        <span className="mode-desc">2 jugadores locales</span>
                    </button>
                </div>

                {mode === "computer" && (
                    <div className="bot-config">
                        <div className="config-section">
                            <h3 className="config-title">Estrategia</h3>
                            <div className="bot-grid">
                                {(Object.keys(BOT_NAMES) as BotType[]).map((type) => (
                                    <button
                                        key={type}
                                        className={`bot-btn ${botType === type ? "active" : ""}`}
                                        onClick={() => setBotType(type)}
                                    >
                                        <span className="bot-name">{BOT_NAMES[type]}</span>
                                        <span className="bot-desc">{BOT_DESCRIPTIONS[type]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {botType !== "random" && (
                            <div className="config-section">
                                <h3 className="config-title">Dificultad</h3>
                                <div className="difficulty-selector">
                                    {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                                        <button
                                            key={d}
                                            className={`diff-btn diff-${d} ${difficulty === d ? "active" : ""}`}
                                            onClick={() => setDifficulty(d)}
                                        >
                                            {DIFFICULTY_LABELS[d]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mode === "human" && (
                    <div className="human-info">
                        <p>🎮 Dos jugadores se turnan en el mismo dispositivo.</p>
                        <p>¡El jugador 1 empieza primero!</p>
                    </div>
                )}

                <button
                    className={`play-btn ${mode ? "ready" : ""}`}
                    onClick={handlePlay}
                    disabled={!mode}
                >
                    {mode ? "¡JUGAR!" : "SELECCIONA UN MODO"}
                </button>
            </div>
        </div>
    );
}
