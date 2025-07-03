import React, { useState } from 'react';
import '../styles/Home.scss';
import worldMap from '../assets/world_map.jpg'; // Ajoute une image de carte du monde dans /src/assets
import { useNavigate } from 'react-router-dom';



const anecdotes = [
  "Le drapeau du Népal est le seul à ne pas être rectangulaire !",
  "Le Belize est le seul pays dont le drapeau porte des humains.",
  "Le drapeau du Danemark est le plus ancien encore utilisé.",
  "Le drapeau de la Libye était entièrement vert de 1977 à 2011.",
  "Le drapeau du Paraguay a un recto et un verso différents !"
];

function Home() {
  const [anecdoteIdx, setAnecdoteIdx] = useState(0);
  const navigate = useNavigate();


  const handleNextAnecdote = () => {
    setAnecdoteIdx((prev) => (prev + 1) % anecdotes.length);
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

      {/* Découvre WavingFlag */}
      <section className="home-section">
        <h2>Découvre WavingFlag</h2>
        <div className="home-discover-cards">
          {/* Mode Solo */}
          <div className="home-discover-card">
            <div className="discover-icon" role="img" aria-label="Solo">🎯</div>
            <h3>Mode Solo</h3>
            <p>Joue à ton rythme, choisis le continent et le nombre de questions.</p>
            <button className="discover-btn" onClick={() => navigate('/quiz')}>Commencer</button>
          </div>
          {/* Mode Multi */}
          <div className="home-discover-card">
            <div className="discover-icon" role="img" aria-label="Multijoueur">🤝</div>
            <h3>Mode Multijoueur</h3>
            <p>Affronte tes amis ou d'autres joueurs en temps réel !</p>
            <button className="discover-btn" onClick={() => navigate('/multiplayer')}>Rejoindre</button>
          </div>
          {/* Anecdote */}
          <div className="home-discover-card">
            <div className="discover-icon" role="img" aria-label="Anecdote">🌍</div>
            <h3>Le savais-tu ?</h3>
            <p>{anecdotes[anecdoteIdx]}</p>
            <button className="discover-btn" onClick={handleNextAnecdote}>Nouvelle anecdote</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
