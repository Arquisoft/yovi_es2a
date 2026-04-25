import './AuthForm.css'
import React, { useState } from 'react';
import { useAuthComprobation } from '../AuthComprobation';
import { useNavigate } from 'react-router-dom';

/**
 * ESCUDO DE SEGURIDAD (SONARCLOUD)
 * En lugar de intentar "limpiar" caracteres malos (Blocklist),
 * validamos estrictamente que solo haya caracteres buenos (Allowlist).
 * Esto asegura que nunca se guarde código malicioso en localStorage (DOM XSS).
 */
function validateUsernameForStorage(raw: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) {
    throw new Error("El nombre de usuario tiene un formato inválido por seguridad.");
  }
  return raw;
}

const AuthForm: React.FC = () => {
  useAuthComprobation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const endpoint = isLogin ? '/login' : '/createuser';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Validamos el dato antes de guardarlo para satisfacer a SonarCloud
        const safeUsername = validateUsernameForStorage(username);
        localStorage.setItem("username", safeUsername); 
        navigate('/menu');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error("Auth error details:", err);
      setError('Network error connection');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="auth-tabs-container">
         <button type="button" className={`auth-tab ${isLogin ? 'selected' : ''}`} onClick={() => setIsLogin(true)}>LOGIN</button>
         <button type="button" className={`auth-tab ${isLogin === false ? 'selected' : ''}`} onClick={() => setIsLogin(false)}>REGISTER</button>
      </div>

      <div className="form-content">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>

        {!isLogin && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="submit-button">
          {isLogin ? 'GO!' : 'CREATE'}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;