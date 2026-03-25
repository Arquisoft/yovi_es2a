// Reemplaza los paneles overlay que antes existían en Lobby.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Historic from './Historic';
import Stats from './Stats';
import '../styles/DataHub.css';

type DataTab = 'historial' | 'estadisticas';

export default function DataHub(): JSX.Element {
    const navigate = useNavigate();
    // Estado local que controla qué tab está activa
    const [activeTab, setActiveTab] = useState<DataTab>('historial');

    return (
        <div className="datahub-container">
            <div className="datahub-card">
                <div className="datahub-header">
                    {/* Botón para volver a /menu */}
                    <button
                        className="datahub-back-btn"
                        onClick={() => navigate('/menu')}
                        title="Volver al menú"
                    >
                        ← Menú
                    </button>
                    <h1 className="datahub-title">Mis datos</h1>
                </div>

                {/* Tabs de navegación entre las dos secciones */}
                <div className="datahub-tabs">
                    <button
                        className={`datahub-tab ${activeTab === 'historial' ? 'active' : ''}`}
                        onClick={() => setActiveTab('historial')}
                    >
                        📋 Historial
                    </button>
                    <button
                        className={`datahub-tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('estadisticas')}
                    >
                        📊 Estadísticas
                    </button>
                </div>

                {/* Contenido condicional según tab activa */}
                <div className="datahub-content">
                    {activeTab === 'historial' && <Historic />}
                    {activeTab === 'estadisticas' && <Stats />}
                </div>
            </div>
        </div>
    );
}