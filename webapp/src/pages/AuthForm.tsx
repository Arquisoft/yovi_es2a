import '../styles/AuthForm.css'
import React, { useState } from 'react';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="register-form">
      {/* LOGIN / REGISTER */}
      <div className="auth-tabs-container">
        <button 
          type="button"
          className={`auth-tab ${isLogin ? 'selected' : ''}`}
          onClick={() => setIsLogin(true)}
          disabled={isLogin}
        >
          LOGIN
        </button>
        <button 
          type="button"
          className={`auth-tab ${!isLogin ? 'selected' : ''}`}
          onClick={() => setIsLogin(false)}
          disabled={!isLogin}
        >
          REGISTER
        </button>
      </div>

      <div className="form-content">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" className="form-input" placeholder="User123" />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" className="form-input" placeholder="••••••••" />
        </div>

        {/* Campo Confirmar Contraseña: solo visible en Registro */}
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              className="form-input" 
              placeholder="••••••••" 
            />
          </div>
        )}

        <button type="button" className="submit-button">
          {isLogin ? 'GO!' : 'CREATE'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;