// Ofrece dos opciones: "Jugar" (→ /lobby) y "Ver datos" (→ /datos)
import { useNavigate } from 'react-router-dom';
import { useAuthComprobation } from '../components/AuthComprobation';
import Navbar from '../components/Navbar';
import '../styles/Menu.css';

export default function Menu(): JSX.Element {
    const navigate = useNavigate();
    useAuthComprobation();

    return (
        <div className="menu-container">
            <Navbar />
            <div className="menu-card">
                <h1 className="menu-title">MENU</h1>
                <p className="menu-subtitle">¿Qué quieres hacer?</p>

                <div className="menu-options">
                    {/* Opción 1: navega a /lobby para configurar y lanzar partida */}
                    <button
                        className="menu-option-btn play"
                        onClick={() => navigate('/lobby')}
                    >
                        <span className="menu-option-icon">🎮</span>
                        <span className="menu-option-label">Jugar</span>
                        <span className="menu-option-desc">Configura y empieza una partida</span>
                    </button>

                    {/* Opción 2: navega a /datos (DataHub) para acceder a historial o estadísticas */}
                    <button
                        className="menu-option-btn data"
                        onClick={() => navigate('/datos')}
                    >
                        <span className="menu-option-icon">📊</span>
                        <span className="menu-option-label">Ver datos</span>
                        <span className="menu-option-desc">Historial y estadísticas</span>
                    </button>
                </div>
            </div>
        </div>
    );
}