import React from 'react';
import { signOut } from "firebase/auth";
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.scss';

function Header({ isLoggedIn = false, profilePic }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <header className="header-container">
      <div className="header-content">
        <span className="header-logo">🌍 WavingFlag</span>
        <nav className="header-nav">
          <a href="/" className="header-link">Accueil</a>
          <a href="/quiz" className="header-link">Quiz</a>
          <a href="#" className="header-link">Profil</a>
        </nav>
        <div className="header-user">
          {isLoggedIn ? (
            <>
              <div className="header-avatar">
                <img
                  src={profilePic || "https://randomuser.me/api/portraits/lego/1.jpg"}
                  alt="Profil"
                />
              </div>
              <button className="header-logout-btn" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <button className="header-login-btn" onClick={handleLoginClick}>Connexion</button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
