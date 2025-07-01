import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { io } from 'socket.io-client';
import '../styles/QuizFlag.scss';
import '../styles/Multiplayer.scss';

function Multiplayer() {
    const [socket, setSocket] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [room, setRoom] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [scores, setScores] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [pseudo, setPseudo] = useState('');
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [user, setUser] = useState(null);
    const [timeLeft, setTimeLeft] = useState(20);
    const [timerActive, setTimerActive] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState(null);
    const [questionResults, setQuestionResults] = useState(null);
    const [countdownToNext, setCountdownToNext] = useState(5);
    
    // Nouvelles options de configuration
    const [questionCount, setQuestionCount] = useState(10);
    const [selectedContinent, setSelectedContinent] = useState('all');
    const [isRoomCreator, setIsRoomCreator] = useState(false);

    // Ajouter la classe au body pour le background uniforme
    useEffect(() => {
        document.body.classList.add('quiz-page');
        
        // Nettoyer la classe quand le composant se démonte
        return () => {
            document.body.classList.remove('quiz-page');
        };
    }, []);

    useEffect(() => {
        // Écouter les changements d'authentification
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    // Timer effect
    useEffect(() => {
        let interval = null;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    // Timer pour le compte à rebours vers la question suivante
    useEffect(() => {
        let interval = null;
        if (questionResults && countdownToNext > 0) {
            interval = setInterval(() => {
                setCountdownToNext(countdownToNext - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [questionResults, countdownToNext]);

    useEffect(() => {
        // Connexion Socket.IO
        const socketUrl = process.env.NODE_ENV === 'production' 
          ? process.env.REACT_APP_SOCKET_URL
          : 'http://localhost:3001';
        
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        // Événements Socket.IO
        newSocket.on('roomUpdate', (roomData) => {
            setRoom(roomData);
        });

        newSocket.on('gameStarted', () => {
            setGameStarted(true);
        });

        newSocket.on('newQuestion', (questionData) => {
            setCurrentQuestion(questionData);
            setTimeLeft(questionData.timeLimit || 20);
            setTimerActive(true);
            setSelectedAnswer(null);
            setAnswerSubmitted(false);
            setAnswerFeedback(null);
            setQuestionResults(null);
            setCountdownToNext(5);
            
            // Reset complet des styles des boutons
            setTimeout(() => {
                const buttons = document.querySelectorAll('.choice-btn');
                buttons.forEach(button => {
                    button.style.background = '';
                    button.style.borderColor = '';
                    button.style.transform = '';
                    button.style.boxShadow = '';
                });
            }, 100);
        });

        newSocket.on('questionResults', (resultsData) => {
            setQuestionResults(resultsData);
            setTimerActive(false);
            setScores(resultsData.players);
            setCountdownToNext(5);
        });

        newSocket.on('gameOver', (finalScores) => {
            setGameOver(true);
            setScores(finalScores.players);
            setTimerActive(false);
            setQuestionResults(null);
        });

        return () => newSocket.close();
    }, []);

    // Créer une room
    const createRoom = () => {
        const userPseudo = user ? user.displayName || user.email : pseudo;
        socket.emit('createRoom', { 
            pseudo: userPseudo,
            gameSettings: {
                questionCount: questionCount,
                continent: selectedContinent
            }
        }, (response) => {
            setRoomId(response.roomId);
            setIsRoomCreator(true);
            setShowCreateForm(false);
        });
    };

    // Rejoindre une room
    const joinRoom = () => {
        const userPseudo = user ? user.displayName || user.email : pseudo;
        socket.emit('joinRoom', { roomId: joinCode, pseudo: userPseudo }, (response) => {
            if (response.error) {
                alert('Code de room invalide');
                return;
            }
            setRoomId(response.roomId);
            setShowJoinForm(false);
        });
    };

    // Lancer la partie
    const startGame = () => {
        socket.emit('startGame', { 
            roomId,
            gameSettings: {
                questionCount: questionCount,
                continent: selectedContinent
            }
        });
    };

    // Répondre à une question
    const answerQuestion = (answer) => {
        if (answerSubmitted) return; // Éviter les clics multiples
        
        setSelectedAnswer(answer);
        setAnswerSubmitted(true);
        
        // Vérifier si la réponse est correcte
        const isCorrect = answer === currentQuestion.question.answer;
        setAnswerFeedback(isCorrect ? 'correct' : 'incorrect');
        
        // Envoyer la réponse au serveur
        socket.emit('answer', { roomId, answer });
    };

    // Mettre à jour les paramètres de jeu
    const updateGameSettings = () => {
        socket.emit('updateGameSettings', { 
            roomId,
            gameSettings: {
                questionCount: questionCount,
                continent: selectedContinent
            }
        });
    };

    // Copier le code de room
    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        alert('Code copié !');
    };

    if (gameOver) {
        return (
            <div className="quiz-container">
                <div className="game-over">
                    <h2>Partie terminée !</h2>
                    <div className="final-score">
                        {scores.map((player, idx) => (
                            <div key={idx} className="player-score">
                                <span>{player.pseudo}</span>
                                <span>{player.score} points</span>
                            </div>
                        ))}
                    </div>
                    <div className="game-actions">
                        <button onClick={() => window.location.href = '/'} className="back-btn">
                            Retour à l'accueil
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameStarted && questionResults) {
        return (
            <div className="quiz-container">
                <div className="scores-display">
                    {scores.map((player, idx) => (
                        <div key={idx} className="player-score">
                            <span className="player-name">{player.pseudo}</span>
                            <span className="player-points">{player.score} pts</span>
                        </div>
                    ))}
                </div>
                <div className="quiz-content">
                    <div className="question-container">
                        <h2 className="question-text">Résultats de la question</h2>
                        
                        <div className="result-message correct">
                            <span className="answer-label">Bonne réponse :</span>
                            <span className="answer-value">{questionResults.correctAnswer}</span>
                        </div>
                        
                        <div className="players-answers">
                            <h4>Réponses des joueurs :</h4>
                            {questionResults.answers.map((answer, idx) => (
                                <div key={idx} className={`player-answer ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                                    <span className="player-name">{answer.playerName}</span>
                                    <span className="player-response">{answer.answer}</span>
                                    <span className="answer-status">
                                        {answer.isCorrect ? '✅' : '❌'}
                                    </span>
                                    {answer.isCorrect && (
                                        <span className="time-taken">({Math.round(answer.timeTaken / 1000)}s)</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="next-question-countdown">
                            <span>Question suivante dans : {countdownToNext}s</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameStarted && currentQuestion) {
        return (
            <div className="quiz-container">
                <div className="quiz-header">
                    <div className="quiz-info">
                        <span className="question-counter">Question {currentQuestion.index + 1} / {currentQuestion.total}</span>
                        <span className="score-display">Scores</span>
                    </div>
                    <div className="timer-container">
                        <div className="timer" style={{ '--time-left': `${(timeLeft / 20) * 100}%` }}>
                            <span className="timer-text">{timeLeft}s</span>
                        </div>
                    </div>
                </div>

                <div className="scores-display">
                    {scores.map((player, idx) => (
                        <div key={idx} className="player-score">
                            <span className="player-name">{player.pseudo}</span>
                            <span className="player-points">{player.score} pts</span>
                        </div>
                    ))}
                </div>

                <div className="quiz-content">
                    <div className="question-container">
                        <h2 className="question-text">Quel est ce pays ?</h2>
                        
                        <div className="flag-container">
                            <img 
                                src={currentQuestion.question.flag} 
                                alt="Drapeau" 
                                className="flag-image"
                            />
                        </div>
                        
                        {answerSubmitted && answerFeedback && (
                            <div className={`result-message ${answerFeedback === 'correct' ? 'correct' : 'incorrect'}`}>
                                {answerFeedback === 'correct' ? '✅ Correct !' : '❌ Incorrect !'}
                            </div>
                        )}
                        
                        <div className="choices-container">
                            {currentQuestion.question.choices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => answerQuestion(choice.name)}
                                    className={`choice-btn ${
                                        selectedAnswer === choice.name ? 'selected' : ''
                                    } ${answerSubmitted ? 'disabled' : ''} ${
                                        answerSubmitted && selectedAnswer === choice.name 
                                            ? answerFeedback 
                                            : ''
                                    }`}
                                    disabled={!timerActive || answerSubmitted}
                                >
                                    {choice.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (room) {
        return (
            <div className="quiz-container">
                <div className="quiz-content">
                    <div className="question-container">
                        <h2 className="question-text">Room: {roomId}</h2>
                        <button onClick={copyRoomCode} className="copy-btn">
                            Copier le code: {roomId}
                        </button>
                        
                        {isRoomCreator && (
                            <div className="game-settings-panel">
                                <h3>Paramètres de jeu</h3>
                                <div className="settings-row">
                                    <div className="setting-group">
                                        <label>Questions :</label>
                                        <select 
                                            value={questionCount} 
                                            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                            className="setting-select"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={15}>15</option>
                                            <option value={20}>20</option>
                                        </select>
                                    </div>
                                    
                                    <div className="setting-group">
                                        <label>Continent :</label>
                                        <select 
                                            value={selectedContinent} 
                                            onChange={(e) => setSelectedContinent(e.target.value)}
                                            className="setting-select"
                                        >
                                            <option value="all">Tous</option>
                                            <option value="Europe">Europe</option>
                                            <option value="Asia">Asie</option>
                                            <option value="Africa">Afrique</option>
                                            <option value="Americas">Amériques</option>
                                            <option value="Oceania">Océanie</option>
                                        </select>
                                    </div>
                                    
                                    <button onClick={updateGameSettings} className="update-settings-btn">
                                        Mettre à jour
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="current-settings">
                            <p><strong>Configuration actuelle :</strong></p>
                            <p>{room.gameSettings?.questionCount || 10} questions - {room.gameSettings?.continent === 'all' ? 'Tous les continents' : room.gameSettings?.continent}</p>
                        </div>
                        
                        <div className="players-list">
                            <h3>Joueurs ({room.players.length})</h3>
                            {room.players.map((player, idx) => (
                                <div key={idx} className={`player ${player.isCreator ? 'creator' : ''}`}>
                                    {player.pseudo}
                                    {player.isCreator && <span className="creator-badge">👑 Créateur</span>}
                                </div>
                            ))}
                        </div>
                        
                        {isRoomCreator && room.players.length >= 2 && (
                            <button onClick={startGame} className="start-btn">
                                Lancer la partie
                            </button>
                        )}
                        
                        {!isRoomCreator && (
                            <div className="waiting-message">
                                En attente que le créateur lance la partie...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (showCreateForm) {
        return (
            <div className="quiz-container">
                <div className="quiz-content">
                    <div className="question-container">
                        <h2 className="question-text">Créer une partie</h2>
                        
                        {!user && (
                            <div className="pseudo-input">
                                <label>Ton pseudo :</label>
                                <input
                                    type="text"
                                    placeholder="Entrez votre pseudo"
                                    value={pseudo}
                                    onChange={(e) => setPseudo(e.target.value)}
                                    className="pseudo-field"
                                />
                            </div>
                        )}
                        
                        <div className="game-settings">
                            <div className="setting-group">
                                <label>Nombre de questions :</label>
                                <select 
                                    value={questionCount} 
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className="setting-select"
                                >
                                    <option value={5}>5 questions</option>
                                    <option value={10}>10 questions</option>
                                    <option value={15}>15 questions</option>
                                    <option value={20}>20 questions</option>
                                </select>
                            </div>
                            
                            <div className="setting-group">
                                <label>Continent :</label>
                                <select 
                                    value={selectedContinent} 
                                    onChange={(e) => setSelectedContinent(e.target.value)}
                                    className="setting-select"
                                >
                                    <option value="all">Tous les continents</option>
                                    <option value="Europe">Europe</option>
                                    <option value="Asia">Asie</option>
                                    <option value="Africa">Afrique</option>
                                    <option value="Americas">Amériques</option>
                                    <option value="Oceania">Océanie</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-actions">
                            <button onClick={createRoom} className="create-btn">
                                Créer la partie
                            </button>
                            <button onClick={() => setShowCreateForm(false)} className="cancel-btn">
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <div className="quiz-content">
                                    <div className="question-container">
                        <h2 className="question-text">Mode Multijoueur</h2>
                    
                    {!showCreateForm && !showJoinForm && (
                        <div className="menu-buttons">
                            <button onClick={() => setShowCreateForm(true)}>
                                Créer une partie
                            </button>
                            <button onClick={() => setShowJoinForm(true)}>
                                Rejoindre une partie
                            </button>
                        </div>
                    )}

                    {showJoinForm && (
                        <div className="join-form">
                            <h3>Rejoindre une partie</h3>
                            <input
                                type="text"
                                placeholder="Code de la partie"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                            {!user && (
                                <input
                                    type="text"
                                    placeholder="Ton pseudo"
                                    value={pseudo}
                                    onChange={(e) => setPseudo(e.target.value)}
                                />
                            )}
                            <button onClick={joinRoom}>
                                Rejoindre
                            </button>
                            <button onClick={() => setShowJoinForm(false)}>
                                Annuler
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Multiplayer;