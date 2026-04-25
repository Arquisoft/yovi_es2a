import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthComprobation } from '../components/AuthComprobation';
import Navbar from '../components/Navbar';
import { getRanking, type RankingEntry } from '../services/gameService';
import '../styles/Ranking.css';
import RankingHelp from './RankingHelp';

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const Ranking: React.FC = () => {
    const navigate = useNavigate();
    useAuthComprobation();

    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const raw = localStorage.getItem('username');
    const currentUser = raw ? decodeURIComponent(raw) : null;

    useEffect(() => {
        getRanking()
            .then(setRanking)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="ranking-container">
            <Navbar />
            <div className="ranking-card">
                <div className="ranking-header">
                    <button
                        className="ranking-back-btn"
                        onClick={() => navigate('/menu')}
                    >
                        ← Menú
                    </button>
                    <h1 className="ranking-title">🏆 Ranking</h1>
                </div>

                <p className="ranking-subtitle">Top 10 jugadores por puntuación</p>

                {loading && (
                    <p className="ranking-status">Cargando ranking...</p>
                )}

                {error && (
                    <p className="ranking-status ranking-error">Error: {error}</p>
                )}

                {!loading && !error && ranking.length === 0 && (
                    <p className="ranking-status">Todavía no hay partidas registradas.</p>
                )}

                {!loading && !error && ranking.length > 0 && (
                    <table className="ranking-table">
                        <thead>
                            <tr>
                                <th className="col-pos">#</th>
                                <th className="col-user">Jugador</th>
                                <th className="col-score">Puntuación <RankingHelp /></th>
                                <th className="col-games">Partidas</th>
                                <th className="col-wins">Victorias</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((entry) => (
                                <tr
                                    key={entry.username}
                                    className={entry.username === currentUser ? 'ranking-row-me' : ''}
                                >
                                    <td className="col-pos">
                                        {MEDAL[entry.position] ?? entry.position}
                                    </td>
                                    <td className="col-user">
                                        <span className="ranking-username">{entry.username}</span>
                                        {entry.username === currentUser && (
                                            <span className="ranking-you-badge">tú</span>
                                        )}
                                    </td>
                                    <td className="col-score ranking-score">{entry.score.toFixed(2)}</td>
                                    <td className="col-games">{entry.totalGames}</td>
                                    <td className="col-wins">{entry.wins}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Ranking;