import React, { useEffect, useState } from 'react';
import { getHistory, type GameHistoryRecord, type HistoryFilters } from '../services/gameService';

const RESULTADO_LABEL: Record<string, string> = {
    '1': '✅ Victoria',
    '2': '❌ Derrota',
    'X': '➖ Empate',
};

const Historic: React.FC = () => {
    const [history, setHistory] = useState<GameHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros activos (disparan petición al backend al cambiar)
    const [filtroResultado, setFiltroResultado] = useState<string>('todos');
    const [filtroRival, setFiltroRival]           = useState<string>('');
    const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
    const [filtroSize, setFiltroSize]             = useState<string>('todos');

    // Estado temporal del input de rival (se aplica al pulsar Buscar o Enter)
    const [rivalInput, setRivalInput] = useState<string>('');

    const username = localStorage.getItem('username');

    useEffect(() => {
        if (!username) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
 
        const filters: HistoryFilters = {};
        if (filtroResultado !== 'todos')    filters.resultado  = filtroResultado as HistoryFilters['resultado'];
        if (filtroRival.trim() !== '')      filters.rival      = filtroRival.trim();
        if (filtroFechaDesde)              filters.fechaDesde = filtroFechaDesde;
        if (filtroFechaHasta)              filters.fechaHasta = filtroFechaHasta;
        if (filtroSize !== 'todos')         filters.size       = Number(filtroSize);

        getHistory(username)
            .then(setHistory)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [username, filtroResultado, filtroRival, filtroFechaDesde, filtroFechaHasta, filtroSize]);
const handleBuscar = () => setFiltroRival(rivalInput);
 
    const handleLimpiar = () => {
        setFiltroResultado('todos');
        setFiltroRival('');
        setRivalInput('');
        setFiltroFechaDesde('');
        setFiltroFechaHasta('');
        setFiltroSize('todos');
    };
 
    const hayFiltrosActivos =
        filtroResultado !== 'todos' ||
        filtroRival.trim() !== ''   ||
        filtroFechaDesde !== ''     ||
        filtroFechaHasta !== ''     ||
        filtroSize !== 'todos';
 
    if (!username) return <p>Debes iniciar sesión para ver tu historial.</p>;
 
    return (
        <div className="historic-container">
            <h2>Historial de {username}</h2>
 
            {/* ── Filtros ── */}
            <div className="historic-filters">
 
                {/* Resultado */}
                <select
                    value={filtroResultado}
                    onChange={(e) => setFiltroResultado(e.target.value)}
                    className="historic-filter-select"
                >
                    <option value="todos">Todos los resultados</option>
                    <option value="1">✅ Victoria</option>
                    <option value="2">❌ Derrota</option>
                    <option value="X">➖ Empate</option>
                </select>
 
                {/* Tamaño tablero */}
                <select
                    value={filtroSize}
                    onChange={(e) => setFiltroSize(e.target.value)}
                    className="historic-filter-select"
                >
                    <option value="todos">Todos los tamaños</option>
                    <option value="5">5x5</option>
                    <option value="7">7x7</option>
                    <option value="9">9x9</option>
                    <option value="11">11x11</option>
                </select>
 
                {/* Rival */}
                <input
                    type="text"
                    placeholder="Buscar rival..."
                    value={rivalInput}
                    onChange={(e) => setRivalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                    className="historic-filter-input"
                />
                <button className="historic-filter-btn" onClick={handleBuscar}>
                    Buscar
                </button>
 
                {/* Fechas */}
                <label className="historic-filter-label">Desde</label>
                <input
                    type="date"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                    className="historic-filter-date"
                />
                <label className="historic-filter-label">Hasta</label>
                <input
                    type="date"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                    className="historic-filter-date"
                />
 
                {hayFiltrosActivos && (
                    <button className="historic-filter-reset" onClick={handleLimpiar}>
                        Limpiar filtros
                    </button>
                )}
            </div>
 
            {loading && <p className="historic-status">Cargando historial...</p>}
            {error   && <p className="historic-status historic-error">Error: {error}</p>}
 
            {!loading && !error && history.length === 0 && (
                <p className="historic-status">
                    {hayFiltrosActivos
                        ? 'No hay partidas que coincidan con los filtros.'
                        : 'Todavía no tienes partidas registradas.'}
                </p>
            )}
 
            {!loading && !error && history.length > 0 && (
                <table className="historic-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Rival</th>
                            <th>Resultado</th>
                            <th>Tablero</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((record) => (
                            <tr key={record._id}>
                                <td>{new Date(record.createdAt).toLocaleString('es-ES')}</td>
                                <td>{record.rival}</td>
                                <td>{RESULTADO_LABEL[record.resultado] ?? record.resultado}</td>
                                <td>{record.size ? `${record.size}x${record.size}` : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
 
export default Historic;