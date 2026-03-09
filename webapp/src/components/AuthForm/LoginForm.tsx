import './AuthForm.css'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

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
        localStorage.setItem("username", username);
        navigate('/lobby');
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

        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <button type="submit" className="submit-button">
          {isLogin ? 'GO!' : 'CREATE'}
        </button>
      </div>
    </form>
  );
};

export default AuthForm;
