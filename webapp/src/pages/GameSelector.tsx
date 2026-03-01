import React, { useState } from 'react';
import '../styles/AuthForm.css'; // Reutilizamos los estilos base

const GameSelector: React.FC = () => {
  const [mode, setMode] = useState<'bot' | 'player'>('bot');

  return (
    <div className="register-form game-selector">
      <div className="form-content">
        <div className="selection-container">
          <button 
            type="button" 
            className={`selection-card ${mode === 'bot' ? 'selected' : ''}`}
            onClick={() => setMode('bot')}
          >
            <div className="icon">🤖</div>
            <span>VS BOT</span>
          </button>

          <button 
            type="button" 
            className={`selection-card ${mode === 'player' ? 'selected' : ''}`}
            onClick={() => setMode('player')}
          >
            <div className="icon">👥</div>
            <span>VS PLAYER</span>
          </button>
        </div>

        <button type="button" className="submit-button">
          START GAME
        </button>
      </div>
    </div>
  );
};

export default GameSelector;