import React, { useState } from 'react';

const RegisterForm: React.FC = () => {
  //Estado que almacena el nombre introducir por el usuario
  const [username, setUsername] = useState('');
  //Estado que almacena el mensaje de exito recibido del backend
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  //Estado que almacena el mensaje de error si algo falla
  const [error, setError] = useState<string | null>(null);
  //Estado oque indicca si la peticion esta en curso
  const [loading, setLoading] = useState(false);

  //Funcion que se ejecuta al enviar el formulario
  const handleSubmit = async (event: React.FormEvent) => {
    //Evita que el formulario recargue la página
    event.preventDefault();
    setResponseMessage(null);
    setError(null);

    //Valida que el username no esté vacio
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    setLoading(true);
    try {
      //Usa la URL del backend definida en las variables de entorno, si no existe
      //usa localhost:3000 por defecto
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
      
      //Hace la petición POST al backend para crear el usuario
      const res = await fetch(`${API_URL}/createuser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const data = await res.json();
      if (res.ok) {
        //Si la peticion OK, muestra el mensaje de bienvenida y limpiar el formulario
        setResponseMessage(data.message);
        setUsername('');
      } else {
        //Si el backend devuelve un error, lo muestra
        setError(data.error || 'Server error');
      }
    } catch (err: any) {
      //Si hay error de red lo muestra
      setError(err.message || 'Network error');
    } finally {
      //Desactiva el loading al terminar
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="form-group">
        <label htmlFor="username">Whats your name?</label>
         {/* Input controlado*/}
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
        />
      </div>
      {/* Botón desactivado mientras la petición está en curso */}
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Entering...' : 'Lets go!'}
      </button>

      {/* Muestra el mensaje de éxito en verde si existe */}
      {responseMessage && (
        <div className="success-message" style={{ marginTop: 12, color: 'green' }}>
          {responseMessage}
        </div>
      )}

      {/* Muestra el mensaje de error en rojo si existe */}
      {error && (
        <div className="error-message" style={{ marginTop: 12, color: 'red' }}>
          {error}
        </div>
      )}
    </form>
  );
};

export default RegisterForm;
