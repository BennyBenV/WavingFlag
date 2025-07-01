import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Quiz.scss';

const Quiz = () => {
  const navigate = useNavigate();
  const [selectedContinent, setSelectedContinent] = useState('world');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);

  const continents = [
    { value: 'world', label: 'Monde', icon: '🌍', description: 'Tous les pays' },
    { value: 'europe', label: 'Europe', icon: '🌍', description: 'Pays européens' },
    { value: 'africa', label: 'Afrique', icon: '🌍', description: 'Pays africains' },
    { value: 'asia', label: 'Asie', icon: '🌏', description: 'Pays asiatiques' },
    { value: 'americas', label: 'Amériques', icon: '🌎', description: 'Pays américains' },
    { value: 'oceania', label: 'Océanie', icon: '🌊', description: 'Pays océaniens' }
  ];

  const questionCounts = [
    { value: 5, label: '5 questions', icon: '⚡', description: 'Quiz rapide' },
    { value: 10, label: '10 questions', icon: '🎯', description: 'Quiz standard' },
    { value: 20, label: '20 questions', icon: '🏆', description: 'Quiz complet' },
    { value: 50, label: '50 questions', icon: '🔥', description: 'Quiz marathon' }
  ];

  const quizModes = [
    {
      id: 'qcm',
      title: 'Quiz QCM',
      description: 'Choisis la bonne réponse parmi 4 propositions',
      icon: '🎯',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
    },
    {
      id: 'free',
      title: 'Quiz Saisie Libre',
      description: 'Écris le nom du pays correspondant au drapeau',
      icon: '✍️',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
    },
    {
      id: 'capitals',
      title: 'Quiz Capitales',
      description: 'Trouve la capitale du pays affiché',
      icon: '🏛️',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
    },
    {
      id: 'multiplayer',
      title: 'Mode Multijoueur',
      description: 'Affronte d\'autres joueurs en temps réel',
      icon: '👥',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
    }
  ];

  const handleContinentClick = (continentValue) => {
    setSelectedContinent(continentValue);
  };

  const handleQuestionCountClick = (count) => {
    setSelectedQuestionCount(count);
  };

  const handleQuizModeClick = (mode) => {
    if (mode.id === 'multiplayer') {
      navigate('/multiplayer');
    } else {
      // Lancer directement le quiz avec les paramètres
      navigate('/quiz/play', { 
        state: { 
          continents: [selectedContinent],
          mode: mode.id,
          count: selectedQuestionCount
        } 
      });
    }
  };

  return (
    <div className="quiz-page">
      {/* Header Section */}
      <div className="quiz-header">
        <div className="quiz-header-content">
          <h1 className="quiz-title">
            <span className="quiz-icon">🚩</span>
            Quiz Drapeaux
          </h1>
          <p className="quiz-subtitle">
            Teste tes connaissances sur les drapeaux du monde
          </p>
        </div>
      </div>

      {/* Quiz Container */}
      <div className="quiz-container">
        {/* Continents Selection */}
        <div className="quiz-modes">
          <h2 className="section-title">Choisis un continent</h2>
          <div className="quiz-grid">
            {continents.map((continent) => (
              <div 
                key={continent.value} 
                className={`quiz-card continent-card ${selectedContinent === continent.value ? 'selected' : ''}`}
                onClick={() => handleContinentClick(continent.value)}
              >
                <div className="quiz-card-content">
                  <div className="quiz-card-icon">{continent.icon}</div>
                  <h3 className="quiz-card-title">{continent.label}</h3>
                  <p className="quiz-card-description">{continent.description}</p>
                  <div className="quiz-card-arrow">
                    {selectedContinent === continent.value ? '✓' : '○'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Count Selection */}
        <div className="quiz-modes">
          <h2 className="section-title">Nombre de questions</h2>
          <div className="quiz-grid">
            {questionCounts.map((count) => (
              <div 
                key={count.value} 
                className={`quiz-card question-count-card ${selectedQuestionCount === count.value ? 'selected' : ''}`}
                onClick={() => handleQuestionCountClick(count.value)}
              >
                <div className="quiz-card-content">
                  <div className="quiz-card-icon">{count.icon}</div>
                  <h3 className="quiz-card-title">{count.label}</h3>
                  <p className="quiz-card-description">{count.description}</p>
                  <div className="quiz-card-arrow">
                    {selectedQuestionCount === count.value ? '✓' : '○'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Modes Grid */}
        <div className="quiz-modes">
          <h2 className="section-title">Choisis ton mode de jeu</h2>
          <div className="quiz-grid">
            {quizModes.map((mode) => (
              <div 
                key={mode.id} 
                className="quiz-card"
                onClick={() => handleQuizModeClick(mode)}
              >
                <div 
                  className="quiz-card-content"
                  style={{ '--card-gradient': mode.gradient }}
                >
                  <div className="quiz-card-icon">{mode.icon}</div>
                  <h3 className="quiz-card-title">{mode.title}</h3>
                  <p className="quiz-card-description">{mode.description}</p>
                  <div className="quiz-card-arrow">→</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz; 