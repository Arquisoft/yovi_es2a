import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lobby.css';

type GameMode = "human" | "computer" | null;
type BotType = "random" | "defensive" | "offensive" | "positional";
type Difficulty = "easy" | "medium" | "hard";

const BOT_NAMES: Record<BotType, string> = {
    random: "Random",
    defensive: "Defensive",
    offensive: "Offensive",
    positional: "Positional",
};

const BOT_DESCRIPTIONS: Record<BotType, string> = {
    random: "Plays randomly. Perfect for beginners.",
    defensive: "Blocks your moves and plays safe.",
    offensive: "Aggressive playstyle, always attacking.",
    positional: "Controls key positions on the board.",
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
                <h1 className="lobby-title">CHOOSE YOUR BATTLE</h1>
                <p className="lobby-subtitle">How do you want to play?</p>

                <div className="mode-selector">
                    <button
                        className={`mode-btn ${mode === "computer" ? "active" : ""}`}
                        onClick={() => setMode("computer")}
                    >
                        <span className="mode-icon">🤖</span>
                        <span className="mode-label">vs Machine</span>
                        <span className="mode-desc">Play against AI</span>
                    </button>
                    <button
                        className={`mode-btn ${mode === "human" ? "active" : ""}`}
                        onClick={() => setMode("human")}
                    >
                        <span className="mode-icon">👥</span>
                        <span className="mode-label">vs Human</span>
                        <span className="mode-desc">Local 2 players</span>
                    </button>
                </div>

                {mode === "computer" && (
                    <div className="bot-config">
                        <div className="config-section">
                            <h3 className="config-title">Strategy</h3>
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
                                <h3 className="config-title">Difficulty</h3>
                                <div className="difficulty-selector">
                                    {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                                        <button
                                            key={d}
                                            className={`diff-btn diff-${d} ${difficulty === d ? "active" : ""}`}
                                            onClick={() => setDifficulty(d)}
                                        >
                                            {d.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mode === "human" && (
                    <div className="human-info">
                        <p>🎮 Two players take turns on the same device.</p>
                        <p>Player 1 goes first!</p>
                    </div>
                )}

                <button
                    className={`play-btn ${mode ? "ready" : ""}`}
                    onClick={handlePlay}
                    disabled={!mode}
                >
                    {mode ? "PLAY!" : "SELECT A MODE"}
                </button>
            </div>
        </div>
    );
}
