import React, { useEffect, useState } from 'react';
import { getHistory, type GameHistoryRecord } from '../services/gameService';

const RESULTADO_LABEL: Record<string, string> = {
    '1': '✅ Victoria',
    '2': '❌ Derrota',
    'X': '➖ Empate',
};

const Historic: React.FC = () => {
    const [history, setHistory] = useState<GameHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const username = localStorage.getItem('username');

    useEffect(() => {
        if (!username) {
            setLoading(false);
            return;
        }
        getHistory(username)
            .then(setHistory)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [username]);

    if (!username)      return <p>Debes iniciar sesión para ver tu historial.</p>;
    if (loading)        return <p>Cargando historial...</p>;
    if (error)          return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (history.length === 0) return <p>Todavía no tienes partidas registradas.</p>;

    return (
        <div className="historic-container">
            <h2>Historial de {username}</h2>
            <table className="historic-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Rival</th>
                        <th>Resultado</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((record) => (
                        <tr key={record._id}>
                            <td>{new Date(record.createdAt).toLocaleString('es-ES')}</td>
                            <td>{record.rival}</td>
                            <td>{RESULTADO_LABEL[record.resultado] ?? record.resultado}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Historic;