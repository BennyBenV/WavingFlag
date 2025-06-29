import React, { useEffect, useState, useRef } from 'react';
import '../styles/QuizFlag.scss';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

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
    .replace(/[^a-z0-9]/g, ''); // retire tout sauf lettres et chiffres
}

function QuizFlag() {
  const [countries, setCountries] = useState([]);
  const [questions, setQuestions] = useState([]); // Pour QCM/capital
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState('');
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [lockInput, setLockInput] = useState(false); // Pour éviter la double validation
  const [userAnswers, setUserAnswers] = useState([]); // Stocke les réponses de l'utilisateur
  const [quizFinished, setQuizFinished] = useState(false); // Pour afficher le récapitulatif
  const [hasTried, setHasTried] = useState(false);
  const [initialCountries, setInitialCountries] = useState([]);

  const inputRef = useRef();

  const query = useQuery();
  const quiz = query.get('quiz'); // ex: 'europe'
  const mode = query.get('mode'); // ex: 'qcm' ou 'capital'
  const count = query.get('count'); // ex: '20' ou 'Tous'

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? `${window.location.origin}/api/countries`
      : 'http://localhost:3001/api/countries';
    
    axios.get(apiUrl)
      .then(response => {
        let filtered = response.data;
        if (quiz && quiz !== 'world') {
          filtered = filtered.filter(country =>
            country.continents && country.continents.some(cont =>
              cont.toLowerCase() === quiz
            )
          );
        }
        const shuffled = shuffle(filtered);
        const selected = count === 'Tous' ? shuffled : shuffled.slice(0, Number(count));
        setCountries(selected);
        setInitialCountries(selected);
        setCurrentIndex(0);
        setScore(0);
        setUserInput('');
        setResult('');
        setAnswered(false);
        setSelectedChoice(null);
        setHistory([]);
        setLockInput(false);
        setUserAnswers([]);
        setQuizFinished(false);
        // Génération des questions QCM
        if (mode === 'qcm') {
          const qcmQuestions = selected.map((country, idx) => {
            const others = shuffled.filter(c => c.name !== country.name);
            const wrongChoices = shuffle(others).slice(0, 3);
            const choices = shuffle([
              { name: country.name, isCorrect: true },
              ...wrongChoices.map(c => ({ name: c.name, isCorrect: false }))
            ]);
            return {
              flag: country.flag,
              answer: country.name,
              choices
            };
          });
          setQuestions(qcmQuestions);
        }
        // Génération des questions Capitales
        else if (mode === 'capital') {
          const capitalQuestions = selected.map((country, idx) => {
            // On vérifie que le pays a bien une capitale
            const correctCapital = country.capital && country.capital.length > 0 ? country.capital[0] : null;
            // 3 mauvaises capitales aléatoires (différentes de la bonne et non nulles)
            const others = shuffled.filter(c => c.name !== country.name && c.capital && c.capital.length > 0);
            const wrongChoices = shuffle(others).slice(0, 3).map(c => c.capital[0]);
            const choices = shuffle([
              { name: correctCapital, isCorrect: true },
              ...wrongChoices.map(cap => ({ name: cap, isCorrect: false }))
            ]);
            return {
              flag: country.flag,
              countryName: country.name,
              answer: correctCapital,
              choices
            };
          });
          setQuestions(capitalQuestions);
        }
        setLoading(false);
      });
  }, [quiz, count, mode]);

  const handleAbandon = () => {
    setQuizFinished(true);
  };

  const finishQuiz = () => {
    setQuizFinished(true);
  };

  // Composant de récapitulatif
  const QuizRecap = () => {
    let recapList = [];
    if (mode === 'free' && quizFinished) {
      // Saisie libre : on complète avec les non tentés
      recapList = initialCountries.map((c, idx) =>
        userAnswers[idx] ? userAnswers[idx] : {
          userAnswer: '',
          correctAnswer: c.name,
          flag: c.flag,
          isCorrect: false,
          notTried: true
        }
      );
    } else if ((mode === 'qcm' || mode === 'capital') && quizFinished) {
      // QCM/Capitales : on complète avec les non répondues
      recapList = questions.map((q, idx) =>
        userAnswers[idx] ? userAnswers[idx] : {
          userAnswer: '',
          correctAnswer: mode === 'qcm' ? q.answer : q.answer,
          flag: q.flag,
          isCorrect: false,
          notTried: true,
          countryName: q.countryName // pour capitales
        }
      );
    } else {
      recapList = userAnswers;
    }
    return (
      <div className="quiz-container">
        <h2>Récapitulatif de la partie</h2>
        <p>Score final : {score} / {(mode === 'free') ? initialCountries.length : questions.length}</p>
        <div className="quiz-recap">
          {recapList.map((answer, idx) => (
            <div key={idx} className="quiz-recap-item">
              <div className="quiz-recap-question">
                {mode === 'qcm' && (
                  <>
                    <img src={questions[idx]?.flag} alt="Drapeau" style={{width: '50px', marginRight: '10px'}} />
                    <span>Quel est ce pays ?</span>
                  </>
                )}
                {mode === 'capital' && (
                  <>
                    <img src={questions[idx]?.flag} alt="Drapeau" style={{width: '50px', marginRight: '10px'}} />
                    <span>Quelle est la capitale de {questions[idx]?.countryName} ?</span>
                  </>
                )}
                {mode === 'free' && (
                  <>
                    <img src={answer.flag} alt="Drapeau" style={{width: '50px', marginRight: '10px'}} />
                    <span>Quel est ce pays ?</span>
                  </>
                )}
              </div>
              <div className="quiz-recap-answers">
                <span>Votre réponse : <strong>{answer.userAnswer || (answer.notTried ? 'Non répondu' : 'Non trouvé')}</strong></span>
                <span>Bonne réponse : <strong>{answer.correctAnswer}</strong></span>
                <span style={{color: answer.isCorrect ? '#16a34a' : '#b91c1c'}}>
                  {answer.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className="quiz-btn quiz-btn-next" onClick={() => window.location.href = '/'}>
          Retour à l'accueil
        </button>
      </div>
    );
  };

  if (loading) return <p>Chargement du quiz...</p>;

  // Affichage du récapitulatif
  if (quizFinished) {
    return <QuizRecap />;
  }

  // QCM MODE
  if (mode === 'qcm' && questions.length > 0) {
    const current = questions[currentIndex];
    const total = questions.length;
    const progressPercent = ((currentIndex) / total) * 100;

    const handleChoice = (choice, idx) => {
      if (answered) return;
      setSelectedChoice(idx);
      setAnswered(true);
      const isCorrect = choice.isCorrect;
      if (isCorrect) {
        setResult('Bonne réponse !');
        setScore(score + 1);
      } else {
        setResult(`Mauvaise réponse ! La bonne réponse était : ${current.answer}`);
      }
      // Stocke la réponse de l'utilisateur
      setUserAnswers(prev => [...prev, {
        userAnswer: choice.name,
        correctAnswer: current.answer,
        isCorrect: isCorrect
      }]);
      setTimeout(() => {
        setAnswered(false);
        setSelectedChoice(null);
        setResult('');
        if (currentIndex < total - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          finishQuiz();
        }
      }, 1200);
    };

    if (currentIndex >= total) {
      return (
        <div className="quiz-container">
          <h2>Quiz terminé !</h2>
          <p>Score final : {score} / {total}</p>
          <button className="quiz-btn quiz-btn-next" onClick={() => window.location.href = '/'}>Retour à l'accueil</button>
        </div>
      );
    }

    return (
      <div className="quiz-container">
        <div className="quiz-progress">
          <span className="quiz-step">{currentIndex + 1}/{total}</span>
          <div className="quiz-bar-bg">
            <div className="quiz-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="quiz-flag-wrapper">
          <img src={current.flag} alt={`Drapeau à deviner`} className="quiz-flag" />
        </div>
        <div className="quiz-qcm-choices">
          {current.choices.map((choice, idx) => (
            <button
              key={idx}
              className={`quiz-qcm-btn${selectedChoice === idx ? (choice.isCorrect ? ' correct' : ' wrong') : ''}`}
              onClick={() => handleChoice(choice, idx)}
              disabled={answered}
            >
              {choice.name}
            </button>
          ))}
        </div>
        <div className="quiz-buttons">
          <button className="quiz-btn quiz-btn-abandon" onClick={handleAbandon}>
            Abandonner
          </button>
        </div>
        <p style={{ minHeight: '24px', marginTop: '12px', fontWeight: 'bold', color: result.startsWith('Bonne') ? '#16a34a' : '#b91c1c' }}>{result}</p>
        <p>Score : {score}</p>
      </div>
    );
  }

  // MODE CAPITAL
  if (mode === 'capital' && questions.length > 0) {
    const current = questions[currentIndex];
    const total = questions.length;
    const progressPercent = ((currentIndex) / total) * 100;

    const handleChoice = (choice, idx) => {
      if (answered) return;
      setSelectedChoice(idx);
      setAnswered(true);
      const isCorrect = choice.isCorrect;
      if (isCorrect) {
        setResult('Bonne réponse !');
        setScore(score + 1);
      } else {
        setResult(`Mauvaise réponse ! La bonne réponse était : ${current.answer}`);
      }
      // Stocke la réponse de l'utilisateur
      setUserAnswers(prev => [...prev, {
        userAnswer: choice.name,
        correctAnswer: current.answer,
        isCorrect: isCorrect
      }]);
      setTimeout(() => {
        setAnswered(false);
        setSelectedChoice(null);
        setResult('');
        if (currentIndex < total - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          finishQuiz();
        }
      }, 1200);
    };

    if (currentIndex >= total) {
      return (
        <div className="quiz-container">
          <h2>Quiz terminé !</h2>
          <p>Score final : {score} / {total}</p>
          <button className="quiz-btn quiz-btn-next" onClick={() => window.location.href = '/'}>Retour à l'accueil</button>
        </div>
      );
    }

    return (
      <div className="quiz-container">
        <div className="quiz-progress">
          <span className="quiz-step">{currentIndex + 1}/{total}</span>
          <div className="quiz-bar-bg">
            <div className="quiz-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
        <div className="quiz-flag-wrapper">
          <img src={current.flag} alt={`Drapeau à deviner`} className="quiz-flag" />
          <div style={{marginTop: '12px', fontWeight: 'bold', fontSize: '1.1rem'}}>{current.countryName}</div>
        </div>
        <div className="quiz-qcm-choices">
          {current.choices.map((choice, idx) => (
            <button
              key={idx}
              className={`quiz-qcm-btn${selectedChoice === idx ? (choice.isCorrect ? ' correct' : ' wrong') : ''}`}
              onClick={() => handleChoice(choice, idx)}
              disabled={answered}
            >
              {choice.name}
            </button>
          ))}
        </div>
        <div className="quiz-buttons">
          <button className="quiz-btn quiz-btn-abandon" onClick={handleAbandon}>
            Abandonner
          </button>
        </div>
        <p style={{ minHeight: '24px', marginTop: '12px', fontWeight: 'bold', color: result.startsWith('Bonne') ? '#16a34a' : '#b91c1c' }}>{result}</p>
        <p>Score : {score}</p>
      </div>
    );
  }

  // SAISIE LIBRE (mode actuel)
  if (!initialCountries.length) return <p>Chargement du quiz...</p>;
  const total = initialCountries.length;
  const progressPercent = ((currentIndex) / total) * 100;

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    setResult('');
  };

  const checkAnswer = (e) => {
    e.preventDefault();
    if (!initialCountries.length || lockInput) return;
    const userAnswer = normalizeAnswer(userInput.trim());
    const correctAnswer = normalizeAnswer(initialCountries[currentIndex].name.trim());
    const isCorrect = userAnswer === correctAnswer;
    if (isCorrect) {
      setResult('Bonne réponse !');
      setScore(score + 1);
      updateUserAnswers(userInput.trim(), true);
      setLockInput(true);
      setTimeout(() => {
        setLockInput(false);
        goToNext();
      }, 300);
    } else {
      setResult('Mauvaise réponse, essaie encore !');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const updateUserAnswers = (answer, isCorrect) => {
    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        userAnswer: answer,
        correctAnswer: initialCountries[currentIndex].name,
        flag: initialCountries[currentIndex].flag,
        isCorrect: isCorrect
      };
      return updated;
    });
  };

  const goToNext = () => {
    if (currentIndex === total - 1) {
      setQuizFinished(true);
      return;
    }
    if (!userAnswers[currentIndex]) {
      updateUserAnswers('', false);
    }
    setCurrentIndex(currentIndex + 1);
    setUserInput(userAnswers[currentIndex + 1]?.userAnswer || '');
    setResult('');
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 10);
  };

  const goToPrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex(currentIndex - 1);
    setUserInput(userAnswers[currentIndex - 1]?.userAnswer || '');
    setResult('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        <span className="quiz-step">{currentIndex + 1}/{total}</span>
        <div className="quiz-bar-bg">
          <div className="quiz-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
      <div className="quiz-flag-wrapper">
        <img src={initialCountries[currentIndex].flag} alt={`Drapeau de ${initialCountries[currentIndex].name}`} className="quiz-flag" />
      </div>
      <form className="quiz-form" onSubmit={checkAnswer} autoComplete="off">
        <input
          type="text"
          className="quiz-input"
          placeholder="Écris le nom du pays"
          value={userInput}
          onChange={handleInputChange}
          autoFocus
          ref={inputRef}
          disabled={lockInput}
        />
      </form>
      <div className="quiz-buttons">
        <button className="quiz-btn quiz-btn-prev" onClick={goToPrev} disabled={currentIndex === 0 || lockInput}>⬅️ Précédent</button>
        <button className="quiz-btn quiz-btn-next" onClick={goToNext} disabled={lockInput}>{currentIndex === total - 1 ? 'Terminer' : 'Suivant ➡️'}</button>
        <button className="quiz-btn quiz-btn-abandon" onClick={handleAbandon} disabled={lockInput}>Abandonner</button>
      </div>
      <p style={{ minHeight: '24px', marginTop: '12px', fontWeight: 'bold', color: result === 'Bonne réponse !' ? '#16a34a' : '#b91c1c' }}>{result}</p>
      <p>Score : {score}</p>
    </div>
  );
}

export default QuizFlag;
