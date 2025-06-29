import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../firebase';
import '../styles/Auth.scss';
import { useNavigate } from 'react-router-dom';

function Register({ onSwitchToLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      if (onRegister) onRegister();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Créer un compte</h2>
      <form className="auth-form" onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="auth-input"
        />
        <button type="submit" className="auth-btn">S'inscrire</button>
      </form>
      <button className="auth-btn google-btn" onClick={handleGoogleRegister}>
        S'inscrire avec Google
      </button>
      {error && <p className="auth-error">{error}</p>}
      <p className="auth-switch">
        Déjà un compte ? <span onClick={onSwitchToLogin}>Se connecter</span>
      </p>
    </div>
  );
}

export default Register;
