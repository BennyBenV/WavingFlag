import React, { useEffect, useState, useRef } from 'react';
import '../styles/QuizFlag.scss';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function normalizeAnswer(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '') // retire tous les espaces
    .replace(/[^a-z0-9]/g, ''); // retire tout sauf lettres et chiffres
}

// Mapping des continents français vers anglais
const continentMapping = {
  'world': 'world',
  'europe': 'Europe',
  'africa': 'Africa',
  'asia': 'Asia',
  'americas': 'Americas',
  'oceania': 'Oceania'
};

const QuizFlag = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [choices, setChoices] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timer, setTimer] = useState(20);
  const [timeLeft, setTimeLeft] = useState(20);
  const [abandoned, setAbandoned] = useState(false);
  const [results, setResults] = useState([]);
  const [usedCountries, setUsedCountries] = useState([]);

  // Récupérer les paramètres depuis la navigation
  const { continents = ['world'], mode = 'qcm', count = 10 } = location.state || {};
  
  // Debug: afficher les paramètres reçus
  console.log('QuizFlag - Paramètres reçus:', { continents, mode, count });

  // Ajouter la classe au body pour le background uniforme
  useEffect(() => {
    document.body.classList.add('quiz-page');
    
    // Nettoyer la classe quand le composant se démonte
    return () => {
      document.body.classList.remove('quiz-page');
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_API_URL + '/api/countries'
      : 'http://localhost:3001/api/countries';
    
    axios.get(apiUrl)
      .then(response => {
        let filtered = response.data;
        
        // Filtrer par continents
        if (!continents.includes('world')) {
          // Convertir les continents français en anglais
          const englishContinents = continents.map(continent => continentMapping[continent]);
          
          filtered = filtered.filter(country => 
            country.continents && country.continents.some(continent => 
              englishContinents.includes(continent)
            )
          );
        }

        // Filtrer selon le mode
        if (mode === 'capitals') {
          filtered = filtered.filter(country => 
            country.capital && country.capital.length > 0
          );
        } else {
          filtered = filtered.filter(country => 
            country.flag && country.name && country.name.trim() !== ''
          );
        }

        setCountries(filtered);
        setFilteredCountries(filtered);
        setTotalQuestions(count === 'Tous' ? filtered.length : count);
        setLoading(false);
        
        if (filtered.length > 0) {
          selectRandomCountry(filtered);
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement des pays:', error);
        setLoading(false);
      });
  }, [continents, mode, count]);

  useEffect(() => {
    if (currentCountry && !gameOver && !abandoned) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentCountry, gameOver, abandoned]);

  const selectRandomCountry = (countriesList) => {
    // Filtrer les pays déjà utilisés
    const availableCountries = countriesList.filter(country => 
      !usedCountries.includes(country.name)
    );
    
    // Si plus assez de pays disponibles, réinitialiser la liste
    if (availableCountries.length === 0) {
      setUsedCountries([]);
      return selectRandomCountry(countriesList);
    }
    
    const randomIndex = Math.floor(Math.random() * availableCountries.length);
    const selectedCountry = availableCountries[randomIndex];
    
    // Ajouter le pays à la liste des utilisés
    setUsedCountries(prev => [...prev, selectedCountry.name]);
    setCurrentCountry(selectedCountry);
    setTimeLeft(timer);
    
    if (mode === 'qcm') {
      // Générer les choix pour QCM
      const correctAnswer = selectedCountry.name;
      const otherCountries = countriesList.filter(c => c.name !== correctAnswer);
      const wrongChoices = otherCountries
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.name);
      
      const allChoices = [correctAnswer, ...wrongChoices].sort(() => Math.random() - 0.5);
      setChoices(allChoices);
    } else if (mode === 'capitals') {
      // Générer les choix pour capitales
      const correctCapital = selectedCountry.capital[0];
      const otherCountries = countriesList.filter(c => c.capital && c.capital[0] !== correctCapital);
      const wrongChoices = otherCountries
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.capital[0]);
      
      const allChoices = [correctCapital, ...wrongChoices].sort(() => Math.random() - 0.5);
      setChoices(allChoices);
    }

    // Refocuser l'input pour le mode saisie libre
    if (mode === 'free' && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    let correct = false;
    let correctAnswer = '';

    if (mode === 'qcm') {
      correct = answer === currentCountry.name;
      correctAnswer = currentCountry.name;
    } else if (mode === 'capitals') {
      correct = answer === currentCountry.capital[0];
      correctAnswer = currentCountry.capital[0];
    } else if (mode === 'free') {
      const normalizedUserAnswer = normalizeAnswer(answer);
      const normalizedCorrectAnswer = normalizeAnswer(currentCountry.name);
      correct = normalizedUserAnswer === normalizedCorrectAnswer;
      correctAnswer = currentCountry.name;
    }
    
    setResults(prev => [...prev, {
      country: currentCountry.name,
      correctAnswer: correctAnswer,
      userAnswer: answer,
      correct: correct,
      flag: currentCountry.flag
    }]);

    if (correct) {
      setScore(prev => prev + 10);
    }

    setIsCorrect(correct);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer(null);
      setIsCorrect(false);
      setUserAnswer('');
      
      if (questionCount + 1 >= totalQuestions) {
        setGameOver(true);
      } else {
        setQuestionCount(prev => prev + 1);
        selectRandomCountry(filteredCountries);
      }
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    handleAnswer(userAnswer);
  };

  const handleSkip = () => {
    if (showResult) return;
    
    let correctAnswer = '';
    if (mode === 'qcm') {
      correctAnswer = currentCountry.name;
    } else if (mode === 'capitals') {
      correctAnswer = currentCountry.capital[0];
    } else if (mode === 'free') {
      correctAnswer = currentCountry.name;
    }

    setResults(prev => [...prev, {
      country: currentCountry.name,
      correctAnswer: correctAnswer,
      userAnswer: 'Passé',
      correct: false,
      flag: currentCountry.flag
    }]);

    setShowResult(true);
    setIsCorrect(false);

    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer(null);
      setIsCorrect(false);
      setUserAnswer('');
      
      if (questionCount + 1 >= totalQuestions) {
        setGameOver(true);
      } else {
        setQuestionCount(prev => prev + 1);
        selectRandomCountry(filteredCountries);
      }
    }, 2000);
  };

  const handleTimeout = () => {
    let correctAnswer = '';
    if (mode === 'qcm') {
      correctAnswer = currentCountry.name;
    } else if (mode === 'capitals') {
      correctAnswer = currentCountry.capital[0];
    } else if (mode === 'free') {
      correctAnswer = currentCountry.name;
    }

    setResults(prev => [...prev, {
      country: currentCountry.name,
      correctAnswer: correctAnswer,
      userAnswer: 'Temps écoulé',
      correct: false,
      flag: currentCountry.flag
    }]);

    if (questionCount + 1 >= totalQuestions) {
      setGameOver(true);
    } else {
      setQuestionCount(prev => prev + 1);
      selectRandomCountry(filteredCountries);
    }
  };

  const handleAbandon = () => {
    setAbandoned(true);
    setGameOver(true);
  };

  const restartGame = () => {
    setScore(0);
    setQuestionCount(0);
    setGameOver(false);
    setAbandoned(false);
    setResults([]);
    setSelectedAnswer(null);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setUsedCountries([]);
    selectRandomCountry(filteredCountries);
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="loading">Chargement des drapeaux...</div>
      </div>
    );
  }

  if (filteredCountries.length === 0) {
    return (
      <div className="quiz-container">
        <div className="error-message">
          <h2>Aucun pays trouvé</h2>
          <p>Aucun pays ne correspond aux critères sélectionnés.</p>
          <button onClick={() => navigate('/quiz')} className="back-btn">Retour au menu</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="quiz-container">
        <div className="game-over">
          <h2>Quiz terminé !</h2>
          <div className="final-score">
            <p>Score final : <span className="score">{score}</span> / {totalQuestions * 10}</p>
            <p>Réponses correctes : {results.filter(r => r.correct).length} / {totalQuestions}</p>
          </div>
          
          <div className="results-summary">
            <h3>Récapitulatif :</h3>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className={`result-item ${result.correct ? 'correct' : 'incorrect'}`}>
                  <img src={result.flag} alt={result.country} />
                  <div className="result-details">
                    <p className="country-name">{result.country}</p>
                    <p className="correct-answer">Réponse : {result.correctAnswer}</p>
                    <p className="user-answer">Ta réponse : {result.userAnswer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="game-actions">
            <button onClick={restartGame} className="restart-btn">Recommencer</button>
            <button onClick={() => navigate('/quiz')} className="back-btn">Retour au menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-info">
          <span className="question-counter">Question {questionCount + 1} / {totalQuestions}</span>
          <span className="score-display">Score : {score}</span>
        </div>
        <div className="timer-container">
          <div className="timer" style={{ '--time-left': `${(timeLeft / timer) * 100}%` }}>
            <span className="timer-text">{timeLeft}s</span>
          </div>
        </div>
        <button onClick={handleAbandon} className="abandon-btn">Abandonner</button>
      </div>

      <div className="quiz-content">
        {currentCountry && (
          <div className="question-container">
            {mode === 'capitals' ? (
              <h2 className="question-text">
                Quelle est la capitale de <span className="country-name">{currentCountry.name}</span> ?
              </h2>
            ) : mode === 'free' ? (
              <h2 className="question-text">Quel est ce pays ?</h2>
            ) : (
              <h2 className="question-text">Quel est ce pays ?</h2>
            )}
            
            <div className="flag-container">
              <img 
                src={currentCountry.flag} 
                alt={`Drapeau de ${currentCountry.name}`} 
                className="flag-image"
              />
            </div>
          </div>
        )}

        {mode === 'free' ? (
          <form onSubmit={handleSubmit} className="answer-form">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Écris le nom du pays..."
              className="answer-input"
              disabled={showResult}
              autoFocus
            />
            <div className="answer-buttons">
              <button type="submit" className="submit-btn" disabled={showResult}>
                Valider
              </button>
              <button type="button" onClick={handleSkip} className="skip-btn" disabled={showResult}>
                Passer
              </button>
            </div>
          </form>
        ) : (
          <div className="choices-container">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(choice)}
                className={`choice-btn ${
                  showResult 
                    ? choice === (mode === 'capitals' ? currentCountry?.capital[0] : currentCountry?.name)
                      ? 'correct'
                      : selectedAnswer === choice
                      ? 'incorrect'
                      : ''
                    : selectedAnswer === choice
                    ? 'selected'
                    : ''
                }`}
                disabled={showResult}
              >
                {choice}
              </button>
            ))}
            <button onClick={handleSkip} className="skip-btn" disabled={showResult}>
              Passer
            </button>
          </div>
        )}

        {showResult && (
          <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✅ Correct !' : `❌ Incorrect. La réponse était : ${mode === 'capitals' ? currentCountry.capital[0] : currentCountry.name}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizFlag;
