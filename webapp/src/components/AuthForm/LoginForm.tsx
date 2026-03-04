import './AuthForm.css'
import React, { useState } from 'react';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación básica en el cliente
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      // Decidimos la ruta según el modo
      const endpoint = isLogin ? '/login' : '/createuser';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert(isLogin ? 'Welcome back!' : 'Account created!');
        // Aquí normalmente guardarías el Token y redirigirías al juego
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Network error connection');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {/* TABS (Tus botones de Login/Register se mantienen igual) */}
      <div className="auth-tabs-container">
         <button type="button" className={`auth-tab ${isLogin ? 'selected' : ''}`} onClick={() => setIsLogin(true)}>LOGIN</button>
         <button type="button" className={`auth-tab ${!isLogin ? 'selected' : ''}`} onClick={() => setIsLogin(false)}>REGISTER</button>
      </div>

      <div className="form-content">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input 
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