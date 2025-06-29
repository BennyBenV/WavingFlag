import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { io } from 'socket.io-client';
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
        socket.emit('createRoom', { pseudo: userPseudo }, (response) => {
            setRoomId(response.roomId);
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
        socket.emit('startGame', { roomId });
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

    // Copier le code de room
    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        alert('Code copié !');
    };

    if (gameOver) {
        return (
            <div className="multiplayer-container">
                <h2>Partie terminée !</h2>
                <div className="final-scores">
                    {scores.map((player, idx) => (
                        <div key={idx} className="player-score">
                            <span>{player.pseudo}</span>
                            <span>{player.score} points</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => window.location.href = '/'}>
                    Retour à l'accueil
                </button>
            </div>
        );
    }

    if (gameStarted && questionResults) {
        return (
            <div className="multiplayer-container">
                <div className="scores-display">
                    {scores.map((player, idx) => (
                        <div key={idx} className="player-score">
                            {player.pseudo}: {player.score}
                        </div>
                    ))}
                </div>
                <div className="question-results">
                    <h3>Résultats de la question</h3>
                    <div className="correct-answer">
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
        );
    }

    if (gameStarted && currentQuestion) {
        return (
            <div className="multiplayer-container">
                <div className="scores-display">
                    {scores.map((player, idx) => (
                        <div key={idx} className="player-score">
                            {player.pseudo}: {player.score}
                        </div>
                    ))}
                </div>
                <div className="question-container">
                    <div className="timer">
                        <span className={`timer-text ${timeLeft <= 5 ? 'timer-warning' : ''}`}>
                            {timeLeft}s
                        </span>
                    </div>
                    <h3>Question {currentQuestion.index + 1}/{currentQuestion.total}</h3>
                    <img src={currentQuestion.question.flag} alt="Drapeau" />
                    
                    {answerSubmitted && answerFeedback && (
                        <div className={`answer-feedback ${answerFeedback}`}>
                            <span className="feedback-text">
                                {answerFeedback === 'correct' ? '✅ Correct !' : '❌ Incorrect !'}
                            </span>
                        </div>
                    )}
                    
                    <div className="choices">
                        {currentQuestion.question.choices.map((choice, idx) => (
                            <button
                                key={idx}
                                data-answer={choice.name}
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
        );
    }

    if (room) {
        return (
            <div className="multiplayer-container">
                <h2>Room: {roomId}</h2>
                <button onClick={copyRoomCode} className="copy-btn">
                    Copier le code: {roomId}
                </button>
                <div className="players-list">
                    <h3>Joueurs ({room.players.length})</h3>
                    {room.players.map((player, idx) => (
                        <div key={idx} className="player">
                            {player.pseudo}
                        </div>
                    ))}
                </div>
                {room.players.length >= 2 && (
                    <button onClick={startGame} className="start-btn">
                        Lancer la partie
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="multiplayer-container">
            <h2>Mode Multijoueur</h2>
            
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

            {showCreateForm && (
                <div className="create-form">
                    <h3>Créer une partie</h3>
                    {!user && (
                        <input
                            type="text"
                            placeholder="Ton pseudo"
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                        />
                    )}
                    <button onClick={createRoom}>
                        Créer la partie
                    </button>
                    <button onClick={() => setShowCreateForm(false)}>
                        Annuler
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
    );
}

export default Multiplayer;