import React, { useEffect, useState } from 'react';
import { getStats, type UserStats } from '../services/gameService';
import '../styles/Stats.css';

const Stats: React.FC = () => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const raw = localStorage.getItem('username');
    const username = raw ? decodeURIComponent(raw) : null;

    useEffect(() => {
        if (!username) { setLoading(false); return; }
        getStats(username)
            .then(setStats)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [username]);

    if (!username) return <p>Debes iniciar sesión para ver tus estadísticas.</p>;
    if (loading)   return <p className="historic-status">Cargando estadísticas...</p>;
    if (error)     return <p className="historic-status historic-error">Error: {error}</p>;
    if (!stats || stats.total === 0)
        return <p className="historic-status">Todavía no tienes partidas registradas.</p>;

    return (
        <div className="stats-container">
            <h2>Estadísticas de {username}</h2>

            <div className="stats-cards">
                <div className="stats-card">
                    <span className="stats-value">{stats.winRate}%</span>
                    <span className="stats-label">Win Rate</span>
                </div>
                <div className="stats-card">
                    <span className="stats-value">{stats.total}</span>
                    <span className="stats-label">Partidas jugadas</span>
                </div>
                <div className="stats-card win">
                    <span className="stats-value">{stats.wins}</span>
                    <span className="stats-label">✅ Victorias</span>
                </div>
                <div className="stats-card loss">
                    <span className="stats-value">{stats.losses}</span>
                    <span className="stats-label">❌ Derrotas</span>
                </div>
                <div className="stats-card streak">
                    <span className="stats-value">🔥 {stats.currentStreak}</span>
                    <span className="stats-label">Racha actual</span>
                </div>
                <div className="stats-card">
                    <span className="stats-value">⭐ {stats.bestStreak}</span>
                    <span className="stats-label">Mejor racha</span>
                </div>
                {stats.mostPlayedRival && (
                    <div className="stats-card">
                        <span className="stats-value">{stats.mostPlayedRival}</span>
                        <span className="stats-label">Rival favorito</span>
                    </div>
                )}
            </div>

            <h3 className="stats-subtitle">Por rival</h3>
            <table className="historic-table">
                <thead>
                    <tr>
                        <th>Rival</th>
                        <th>Jugadas</th>
                        <th>✅</th>
                        <th>❌</th>
                        <th>Win Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(stats.rivalStats)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([rival, s]) => (
                            <tr key={rival}>
                                <td>{rival}</td>
                                <td>{s.total}</td>
                                <td>{s.wins}</td>
                                <td>{s.losses}</td>
                                <td>{Math.round((s.wins / s.total) * 1000) / 10}%</td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
};

export default Stats;