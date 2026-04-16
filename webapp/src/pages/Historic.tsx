import React, { useEffect, useState } from 'react';
import { getHistory, type GameHistoryRecord, type HistoryFilters } from '../services/gameService';
import '../styles/Historic.css';

const BOT_LABELS: Record<string, string> = {
    random_bot:        'Random Bot',
    offensive_easy:    'Ofensivo Fácil',
    offensive_medium:  'Ofensivo Medio',
    offensive_hard:    'Ofensivo Difícil',
    defensive_easy:    'Defensivo Fácil',
    defensive_medium:  'Defensivo Medio',
    defensive_hard:    'Defensivo Difícil',
    positional_easy:   'Posicional Fácil',
    positional_medium: 'Posicional Medio',
    positional_hard:   'Posicional Difícil',
    monte_carlo_bot:   'Monte Carlo',
};

function rivalLabel(rival: string): string {
    return BOT_LABELS[rival] ?? rival;
}

function rivalInitial(rival: string): string {
    return rivalLabel(rival).charAt(0).toUpperCase();
}

function formatDate(iso: string): { date: string; time: string } {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };
}

const Historic: React.FC = () => {
    const [history, setHistory] = useState<GameHistoryRecord[]>([]);
    const [loading, setLoading]  = useState(true);
    const [error, setError]      = useState<string | null>(null);

    const [filtroResultado, setFiltroResultado]   = useState<string>('todos');
    const [filtroRival, setFiltroRival]           = useState<string>('');
    const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
    const [filtroSize, setFiltroSize]             = useState<string>('todos');
    const [rivalInput, setRivalInput]             = useState<string>('');

    const username = localStorage.getItem('username');

    useEffect(() => {
        if (!username) { setLoading(false); return; }

        setLoading(true);
        setError(null);

        const filters: HistoryFilters = {};
        if (filtroResultado !== 'todos') filters.resultado  = filtroResultado as HistoryFilters['resultado'];
        if (filtroRival.trim())          filters.rival      = filtroRival.trim();
        if (filtroFechaDesde)            filters.fechaDesde = filtroFechaDesde;
        if (filtroFechaHasta)            filters.fechaHasta = filtroFechaHasta;
        if (filtroSize !== 'todos')      filters.size       = Number(filtroSize);

        getHistory(username, filters)
            .then(setHistory)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [username, filtroResultado, filtroRival, filtroFechaDesde, filtroFechaHasta, filtroSize]);

    const handleBuscar  = () => setFiltroRival(rivalInput);
    const handleLimpiar = () => {
        setFiltroResultado('todos');
        setFiltroRival('');
        setRivalInput('');
        setFiltroFechaDesde('');
        setFiltroFechaHasta('');
        setFiltroSize('todos');
    };

    const hayFiltros =
        filtroResultado !== 'todos' || filtroRival.trim() !== '' ||
        filtroFechaDesde !== ''     || filtroFechaHasta !== ''   ||
        filtroSize !== 'todos';

    if (!username) return <p className="historic-status">Debes iniciar sesión para ver tu historial.</p>;

    return (
        <div className="historic-container">

            {/* ── Cabecera ── */}
            <div className="historic-head">
                <div>
                    <h2 className="historic-title">Historial</h2>
                    <p className="historic-subtitle">Partidas de <strong>{username}</strong></p>
                </div>
                {!loading && !error && (
                    <span className="historic-count">
                        {history.length} {history.length === 1 ? 'partida' : 'partidas'}
                    </span>
                )}
            </div>

            {/* ── Filtros ── */}
            <div className="historic-filters">
                <div className="filter-row">
                    <select
                        value={filtroResultado}
                        onChange={e => setFiltroResultado(e.target.value)}
                        className="filter-select"
                    >
                        <option value="todos">Todos los resultados</option>
                        <option value="1">Victoria</option>
                        <option value="2">Derrota</option>
                    </select>

                    <select
                        value={filtroSize}
                        onChange={e => setFiltroSize(e.target.value)}
                        className="filter-select"
                    >
                        <option value="todos">Todos los tamaños</option>
                        {Array.from({ length: 27 }, (_, i) => i + 4).map(s => (
                            <option key={s} value={s}>{s}×{s}</option>
                        ))}
                    </select>

                    <div className="filter-search">
                        <input
                            type="text"
                            placeholder="Buscar rival..."
                            value={rivalInput}
                            onChange={e => setRivalInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                            className="filter-input"
                        />
                        <button className="filter-btn-search" onClick={handleBuscar}>Buscar</button>
                    </div>
                </div>

                <div className="filter-row">
                    <div className="filter-date-group">
                        <label className="filter-label">Desde</label>
                        <input
                            type="date"
                            value={filtroFechaDesde}
                            onChange={e => setFiltroFechaDesde(e.target.value)}
                            className="filter-date"
                        />
                    </div>
                    <div className="filter-date-group">
                        <label className="filter-label">Hasta</label>
                        <input
                            type="date"
                            value={filtroFechaHasta}
                            onChange={e => setFiltroFechaHasta(e.target.value)}
                            className="filter-date"
                        />
                    </div>
                    {hayFiltros && (
                        <button className="filter-btn-clear" onClick={handleLimpiar}>
                            × Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* ── Estados ── */}
            {loading && <p className="historic-status">Cargando historial...</p>}
            {error   && <p className="historic-status historic-error">Error: {error}</p>}

            {!loading && !error && history.length === 0 && (
                <div className="historic-empty">
                    <span className="historic-empty-icon">📭</span>
                    <p>{hayFiltros
                        ? 'No hay partidas que coincidan con los filtros.'
                        : 'Todavía no tienes partidas registradas.'
                    }</p>
                </div>
            )}

            {/* ── Lista de tarjetas ── */}
            {!loading && !error && history.length > 0 && (
                <div className="historic-list">
                    {history.map(record => {
                        const { date, time } = formatDate(record.createdAt);
                        const win = record.resultado === '1';
                        return (
                            <div key={record._id} className={`game-card ${win ? 'game-card--win' : 'game-card--loss'}`}>
                                <div className={`game-card__indicator ${win ? 'ind--win' : 'ind--loss'}`} />

                                <div className={`game-card__avatar ${win ? 'avatar--win' : 'avatar--loss'}`}>
                                    {rivalInitial(record.rival)}
                                </div>

                                <div className="game-card__main">
                                    <span className="game-card__rival">{rivalLabel(record.rival)}</span>
                                    {record.size && (
                                        <span className="game-card__size">Tablero {record.size}×{record.size}</span>
                                    )}
                                </div>

                                <div className="game-card__result">
                                    <span className={`result-badge ${win ? 'result-badge--win' : 'result-badge--loss'}`}>
                                        {win ? 'Victoria' : 'Derrota'}
                                    </span>
                                </div>

                                <div className="game-card__date">
                                    <span className="game-card__date-day">{date}</span>
                                    <span className="game-card__date-time">{time}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Historic;