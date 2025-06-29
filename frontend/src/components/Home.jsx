import React, { useState } from 'react';
import '../styles/Home.scss';
import worldMap from '../assets/world_map.jpg'; // Ajoute une image de carte du monde dans /src/assets
import { useNavigate } from 'react-router-dom';

const quizzes = [
  {
    value: "world",
    title: "Tous les drapeaux",
    desc: "Devine les drapeaux de tous les pays du monde.",
    img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80"
  },
  {
    value: "europe",
    title: "Drapeaux d'Europe",
    desc: "Teste tes connaissances sur les drapeaux européens.",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80"
  },
  {
    value: "africa",
    title: "Drapeaux d'Afrique",
    desc: "Reconnais les drapeaux des pays africains.",
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80"
  },
  {
    value: "asia",
    title: "Drapeaux d'Asie",
    desc: "Découvre les drapeaux des pays asiatiques.",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
  },
  {
    value: "americas",
    title: "Drapeaux des Amériques",
    desc: "Teste-toi sur les drapeaux d'Amérique du Nord et du Sud.",
    img: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80"
  },
  {
    value: "oceania",
    title: "Drapeaux d'Océanie",
    desc: "Reconnais les drapeaux des pays d'Océanie.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  }
];

const modes = [
  { value: 'qcm', label: 'QCM' },
  { value: 'free', label: 'Saisie libre' },
  { value: 'capital', label: 'Capitales' }
];

const questionCounts = [10, 20, 50, 'Tous'];

const leaderboard = [
];

function Home() {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedCount, setSelectedCount] = useState(null);
  const navigate = useNavigate();

  // Pour la navigation, adapte selon ton routeur
  const handleStart = () => {
    // Exemple avec window.location, à remplacer par navigate si tu utilises react-router
    window.location.href = `/quiz?quiz=${selectedQuiz}&mode=${selectedMode}&count=${selectedCount}`;
  };

  return (
    <div className="home-container">
      {/* Bannière */}
      <div className="home-banner" style={{ backgroundImage: `url(${worldMap})` }}>
        <div className="home-banner-content">
          <h1>Teste tes connaissances en géographie</h1>
          <p>Explore le monde, défie tes amis et progresse dans notre quiz interactif sur les drapeaux !</p>
        </div>
      </div>

      {/* Bouton Multijoueur */}
      <section className="home-multiplayer-section">
        <button 
          className="home-multiplayer-btn"
          onClick={() => navigate('/multiplayer')}
        >
          <div className="multiplayer-text">
            <h3>Jouer en Multijoueur</h3>
            <p>Affronte tes amis en temps réel !</p>
          </div>
        </button>
      </section>

      {/* Quizz en vedette */}
      <section className="home-section">
        <h2>Quiz en vedette</h2>
        <div className="home-quizzes">
          {quizzes.map((quiz) => (
            <div
              className={`home-quiz-card flip-card${selectedQuiz === quiz.value ? ' flipped' : ''}`}
              key={quiz.value}
              style={{ position: 'relative' }}
            >
              <div className="flip-card-inner">
                {/* Face avant */}
                <div className="flip-card-front">
                  <img src={quiz.img} alt={quiz.title} />
                  <div>
                    <h3>{quiz.title}</h3>
                    <p>{quiz.desc}</p>
                    <button
                      className="home-btn"
                      onClick={() => {
                        setSelectedQuiz(quiz.value);
                        setSelectedMode(null);
                        setSelectedCount(null);
                      }}
                    >
                      Commencer
                    </button>
                  </div>
                </div>
                {/* Face arrière */}
                <div className="flip-card-back">
                  {!selectedMode ? (
                    <>
                      <h4>Choisis un mode :</h4>
                      <div className="home-popup-options">
                        {modes.map((mode) => (
                          <button
                            key={mode.value}
                            className="home-popup-btn"
                            onClick={() => setSelectedMode(mode.value)}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                      <button className="home-popup-close" onClick={() => setSelectedQuiz(null)}>Annuler</button>
                    </>
                  ) : !selectedCount ? (
                    <>
                      <h4>Combien de questions ?</h4>
                      <div className="home-popup-options">
                        {questionCounts.map((q) => (
                          <button
                            key={q}
                            className="home-popup-btn"
                            onClick={() => setSelectedCount(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                      <button className="home-popup-back" onClick={() => setSelectedMode(null)}>Retour</button>
                    </>
                  ) : (
                    <>
                      <button className="home-popup-start" onClick={handleStart}>
                        Lancer le quiz !
                      </button>
                      <button className="home-popup-back" onClick={() => setSelectedCount(null)}>Retour</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modes de jeu */}
      <section className="home-section">
        <h2>Modes de jeu</h2>
        <div className="home-modes">
          {modes.map((mode, idx) => (
            <div className="home-mode-card" key={idx}>
              <span className="home-mode-icon">{mode.label}</span>
              <div>
                <h4>{mode.label}</h4>
                <p>{mode.label === 'QCM' ? 'Réponds à des questions à choix multiples.' : mode.label === 'Saisie libre' ? 'Réponds à des questions sans limite de temps.' : 'Trouve les capitales des pays.'}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="home-section">
        <h2>Classement</h2>
        <table className="home-leaderboard">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Utilisateur</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.rank}>
                <td>{entry.rank}</td>
                <td>{entry.user}</td>
                <td>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default Home;
