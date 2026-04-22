import './AuthForm.css'
import React, { useState} from 'react';
import { useAuthComprobation } from '../AuthComprobation';
import { useNavigate} from 'react-router-dom';

/**
 * Sanitiza el username eliminando caracteres de inyección HTML/script
 * antes de escribirlo en localStorage.
 * Sonar CWE-20 / CWE-79: tainted data must be sanitized before storage.
 */
function sanitizeUsername(raw: string): string {
  return raw.replace(/[<>"'&]/g, "");
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
        const sanitizedUsername = sanitizeUsername(username);
        localStorage.setItem("username", sanitizedUsername); // NOSONAR: username sanitized via sanitizeUsername before storage
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