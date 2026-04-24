import React, { useState } from 'react';
import '../styles/RankingHelp.css'
const RankingHelp: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <>
            {/* El icono de ayuda sutil que va en la cabecera de la tabla */}
            <button 
                className="ranking-help-trigger" 
                onClick={openModal}
                title="¿Cómo se calcula la puntuación?"
                aria-label="Ayuda sobre la puntuación"
            >
                ?
            </button>

            {/* El Modal Flotante (solo se renderiza si isOpen es true) */}
            {isOpen && (
                <div className="ranking-help-overlay" onClick={closeModal}>
                    {/* onClick={e => e.stopPropagation()} evita que al hacer clic dentro se cierre */}
                    <div className="ranking-help-modal" onClick={e => e.stopPropagation()}>
                        
                        <div className="ranking-help-header">
                            <h3>¿Cómo se calcula la Puntuación?</h3>
                            <button className="ranking-help-close" onClick={closeModal}>✖</button>
                        </div>
                        
                        <div className="ranking-help-content">
                            <p className="ranking-help-intro">
                                Tu puntuación no depende solo de cuántas veces ganas, sino de la <strong>calidad de tus victorias</strong>. Nuestro algoritmo se basa en 4 pilares:
                            </p>
                            
                            <ul className="ranking-help-list">
                                <li>
                                    <strong>⚔️ Dificultad del Rival:</strong> Diferentes oponentes otorgan distintos multiplicadores base. ¡Busca retos para sumar más rápido!
                                    
                                    {/* Este es el acordeón interactivo */}
                                    <details className="ranking-multiplier-details">
                                        <summary>Ver multiplicadores por rival 📊</summary>
                                        <div className="ranking-multiplier-grid">
                                            <div><span>Bot Aleatorio</span> <strong>x1.0</strong></div>
                                            <div><span>Bots Fáciles</span> <strong>x1.5</strong></div>
                                            <div><span>Bots Medios</span> <strong>x2.5</strong></div>
                                            <div><span>Bots Difíciles</span> <strong>x4.0</strong></div>
                                            <div><span>👤 Humanos</span> <strong>x5.0</strong></div>
                                            <div><span>🤖 Bot Monte Carlo</span> <strong className="text-legendary">x7.0</strong></div>
                                        </div>
                                    </details>
                                </li>
                                <li>
                                    <strong>🏆 Tus Victorias:</strong> Es la base de tu puntuación. Cuantas más veces derrotes a un rival duro, más sumarás.
                                </li>
                                <li>
                                    <strong>📈 Confianza (Anti-suerte):</strong> No puedes ser Top 1 ganando una sola partida. El sistema necesita que juegues unas 30 partidas contra un rival para fiarse de tus estadísticas y darte el 100% de los puntos.
                                </li>
                                <li>
                                    <strong>🎯 Eficacia:</strong> Premiamos jugar bien. Si ganas muchas partidas y pierdes pocas, recibirás un multiplicador extra basado en tu % de victorias.
                                </li>
                            </ul>
                            
                            <button className="ranking-help-button" onClick={closeModal}>
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RankingHelp;