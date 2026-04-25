import React, { useEffect, useState } from 'react';
import { getStats, type UserStats } from '../services/gameService';
import '../styles/Stats.css';

const RIVAL_NAMES: Record<string, string> = {
    random_bot:        'Bot Aleatorio',
    defensive_easy:    'Bot Defensivo (Fácil)',
    defensive_medium:  'Bot Defensivo (Medio)',
    defensive_hard:    'Bot Defensivo (Difícil)',
    offensive_easy:    'Bot Ofensivo (Fácil)',
    offensive_medium:  'Bot Ofensivo (Medio)',
    offensive_hard:    'Bot Ofensivo (Difícil)',
    positional_easy:   'Bot Posicional (Fácil)',
    positional_medium: 'Bot Posicional (Medio)',
    positional_hard:   'Bot Posicional (Difícil)',
    monte_carlo_bot:   'Bot Monte Carlo',
};

function friendlyName(rival: string): string {
    return RIVAL_NAMES[rival] ?? rival;
}

function rivalInitial(rival: string): string {
    return friendlyName(rival).charAt(0).toUpperCase();
}

const Stats: React.FC = () => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const username = localStorage.getItem('username');

    useEffect(() => {
        if (!username) { setLoading(false); return; }
        getStats(username)
            .then(setStats)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [username]);

    interface RivalStat { wins: number; losses: number; total: number; }

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
                    <div className="stats-card favorite">
                        <span className="stats-value">🎯</span>
                        <span className="stats-label-main">{friendlyName(stats.mostPlayedRival)}</span>
                        <span className="stats-label">Rival favorito</span>
                    </div>
                )}
            </div>

            <h3 className="stats-subtitle">Por rival</h3>
            <div className="historic-list">
                {Object.entries(stats.rivalStats)
                    .sort(([, a], [, b]) => (b as RivalStat).total - (a as RivalStat).total)
                    .map(([rival, s]) => {
                        const rs = s as RivalStat;
                        const winRate = Math.round((rs.wins / rs.total) * 1000) / 10;
                        const isWinning = rs.wins >= rs.losses;
                        return (
                            <div key={rival} className="game-card">
                                <div className={`game-card__indicator ${isWinning ? 'ind--win' : 'ind--loss'}`} />
                                <div className={`game-card__avatar ${isWinning ? 'avatar--win' : 'avatar--loss'}`}>
                                    {rivalInitial(rival)}
                                </div>
                                <div className="game-card__main">
                                    <span className="game-card__rival">{friendlyName(rival)}</span>
                                    <span className="game-card__size">{rs.total} partidas jugadas</span>
                                </div>
                                <div className="rival-stat__badges">
                                    <span className="result-badge result-badge--win">{rs.wins}V</span>
                                    <span className="result-badge result-badge--loss">{rs.losses}D</span>
                                </div>
                                <div className="rival-stat__winrate">
                                    <span className={`rival-winrate-value ${isWinning ? 'wr--pos' : 'wr--neg'}`}>
                                        {winRate}%
                                    </span>
                                    <span className="rival-winrate-label">win rate</span>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default Stats;