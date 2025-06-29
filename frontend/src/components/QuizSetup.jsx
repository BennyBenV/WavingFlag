import React, { useState } from 'react';
import '../styles/QuizSetup.scss';

const continents = [
  { value: 'world', label: 'Monde' },
  { value: 'europe', label: 'Europe' },
  { value: 'africa', label: 'Afrique' },
  { value: 'asia', label: 'Asie' },
  { value: 'americas', label: 'Amériques' },
  { value: 'oceania', label: 'Océanie' }
];

const modes = [
  { value: 'qcm', label: 'QCM' },
  { value: 'free', label: 'Saisie libre' },
  { value: 'capital', label: 'Capitales' }
];

const questionCounts = [10, 20, 50, 'Tous'];

function QuizSetup({ onStart }) {
  const [step, setStep] = useState(1);
  const [continent, setContinent] = useState('world');
  const [mode, setMode] = useState('qcm');
  const [count, setCount] = useState(10);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleStart = () => {
    // onStart({ continent, mode, count });
    // ou navigate('/quiz', { state: { continent, mode, count } });
  };

  return (
    <div className="quiz-setup-container">
      {step === 1 && (
        <div>
          <h2>Choisis un continent</h2>
          <div className="quiz-setup-options">
            {continents.map(c => (
              <button
                key={c.value}
                className={`quiz-setup-btn${continent === c.value ? ' selected' : ''}`}
                onClick={() => setContinent(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button className="quiz-setup-next" onClick={handleNext}>Suivant</button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2>Choisis un mode de jeu</h2>
          <div className="quiz-setup-options">
            {modes.map(m => (
              <button
                key={m.value}
                className={`quiz-setup-btn${mode === m.value ? ' selected' : ''}`}
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button className="quiz-setup-prev" onClick={handlePrev}>Précédent</button>
          <button className="quiz-setup-next" onClick={handleNext}>Suivant</button>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2>Combien de questions ?</h2>
          <div className="quiz-setup-options">
            {questionCounts.map(q => (
              <button
                key={q}
                className={`quiz-setup-btn${count === q ? ' selected' : ''}`}
                onClick={() => setCount(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <button className="quiz-setup-prev" onClick={handlePrev}>Précédent</button>
          <button className="quiz-setup-start" onClick={handleStart}>Lancer le quiz</button>
        </div>
      )}
    </div>
  );
}

export default QuizSetup;

