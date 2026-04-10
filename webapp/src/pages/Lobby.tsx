import { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthComprobation } from '../components/AuthComprobation';
import Navbar from '../components/Navbar';
import '../styles/Lobby.css';




type GameMode = "human" | "computer" | null;
type BotType = "random" | "defensive" | "offensive" | "positional" | "monte_carlo";
type Difficulty = "easy" | "medium" | "hard";

const BOT_NAMES: Record<BotType, string> = {
    random: "Aleatorio",
    defensive: "Defensivo",
    offensive: "Ofensivo",
    positional: "Posicional",
    monte_carlo: "Monte Carlo",
};

const BOT_DESCRIPTIONS: Record<BotType, string> = {
    random: "Juega al azar. Perfecto para principiantes.",
    defensive: "Bloquea tus movimientos y juega seguro.",
    offensive: "Intenta ganar jugando ofensivamente.",
    positional: "Controla las posiciones clave del tablero.",
    monte_carlo: "Simula partidas para encontrar la mejor jugada.",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    easy: "FÁCIL",
    medium: "MEDIO",
    hard: "DIFÍCIL",
};

// Bots que no tienen selector de dificultad
const BOTS_WITHOUT_DIFFICULTY: BotType[] = ["random", "monte_carlo"];

function getBotId(type: BotType, difficulty: Difficulty): string {
    if (type === "random") return "random_bot";
    if (type === "monte_carlo") return "monte_carlo_bot";
    return `${type}_${difficulty}`;
}

export default function Lobby(): JSX.Element {
    const username = localStorage.getItem("username") ?? undefined;
    const navigate = useNavigate();
    useAuthComprobation();
    const [mode, setMode] = useState<GameMode>(null);
    const [botType, setBotType] = useState<BotType>("random");
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [boardSize, setBoardSize] = useState(7); // Valor inicial 7

    useEffect(() => {
            if (username == null) {
                navigate('/');
            }
        }, [username, navigate]);

    const handlePlay = () => {
        if (mode === "human") {
            navigate('/game', { state: { mode: "human", boardSize } });
        } else if (mode === "computer") {
            const botId = getBotId(botType, difficulty);
            navigate('/game', { state: { mode: "computer", botId, boardSize } });
        }
    };

    return (
        <div className="lobby-container">
            <Navbar />
            <div className="lobby-card">

                {/* Botón que vuelve al menu */}
                <div className="lobby-header">
                    <button
                        className="history-btn"
                        onClick={() => navigate('/menu')}
                        title="Volver al menú"
                    >
                        ← Menú
                    </button>
                </div>

            

                <h1 className="lobby-title">ELIGE TU PARTIDA</h1>
                <p className="lobby-subtitle">¿Cómo quieres jugar?</p>

                {/* Selector de tamaño de tablero */}
                <div className="board-size-selector" style={{ marginBottom: 24 }}>
                    <label htmlFor="board-size-range" style={{ fontWeight: 500 }}>
                        Tamaño del tablero: <span style={{ fontWeight: 700 }}>{boardSize} x {boardSize}</span>
                    </label>
                    <input
                        id="board-size-range"
                        type="range"
                        min={4}
                        max={30}
                        value={boardSize}
                        onChange={e => setBoardSize(Number(e.target.value))}
                        style={{ width: '100%', marginTop: 8 }}
                    />
                </div>

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

                        {/* Selector de dificultad solo para bots que lo tienen */}
                        {!BOTS_WITHOUT_DIFFICULTY.includes(botType) && (
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
