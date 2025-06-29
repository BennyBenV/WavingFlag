const express = require('express');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rooms = require('./rooms');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ton-frontend-url.vercel.app', 'https://ton-frontend-url.netlify.app']
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Middleware pour autoriser le CORS (pour le frontend plus tard)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Route de test
app.get('/', (req, res) => {
  res.send('API Quiz Drapeaux opérationnelle !');
});

// Exemple de route pour récupérer les pays
app.get('/api/countries', async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags,continents,capital,translations');
    const countries = response.data.map(country => ({
      name: country.translations?.fra?.common || country.name.common,
      flag: country.flags.svg,
      continents: country.continents,
      capital: country.capital,
    }));
    res.json(countries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://ton-frontend-url.vercel.app', 'https://ton-frontend-url.netlify.app']
      : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Gestion des connexions
io.on('connection', (socket) => {
  console.log('Un joueur connecté : ', socket.id);

  // Création d'une room
  socket.on('createRoom', ({pseudo}, callback) => {
    const roomId = rooms.createRoom(pseudo, socket.id);
    socket.join(roomId);
    callback({roomId});
    io.to(roomId).emit('roomUpdate', rooms.getRoom(roomId));
  });

  // Rejoindre une room
  socket.on('joinRoom', ({roomId, pseudo}, callback) => {
    const ok = rooms.joinRoom(roomId, pseudo, socket.id);
    if (!ok) return callback({error : 'Room not found'});
    socket.join(roomId);
    callback({roomId});
    io.to(roomId).emit('roomUpdate', rooms.getRoom(roomId));
  });

  // Lancer la partie
  socket.on('startGame', async ({ roomId }) => {
    const ok = await rooms.startGame(roomId);
    if (!ok) {
      socket.emit('error', { message: 'Erreur lors du lancement de la partie' });
      return;
    }
    io.to(roomId).emit('gameStarted');
    sendQuestion(roomId);
  });

  // Réception des réponses
  socket.on('answer', ({ roomId, answer }) => {
    const room = rooms.getRoom(roomId);
    if(!room || !room.questionInProgress) return;
    
    const player = room.players.find( p => p.id === socket.id);
    if (!player) return;
    
    const timeTaken = Date.now() - room.questionStartTime;
    rooms.addAnswer(roomId, socket.id, answer, timeTaken);

    // Si tous les joueurs ont répondu OU si le timeout est atteint
    if(room.answers.length === room.players.length){
      processQuestionResults(roomId);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    rooms.removePlayer(socket.id);
    // on informe toutes les rooms de la maj
    Object.keys(rooms.getAllRooms()).forEach(roomId => {
      io.to(roomId).emit('roomUpdate', rooms.getRoom(roomId));
    });
  });
});

// Fonction pour traiter les résultats d'une question
function processQuestionResults(roomId) {
  const room = rooms.getRoom(roomId);
  if(!room) return;
  
  // Clear le timeout
  rooms.clearQuestionTimeout(roomId);
  room.questionInProgress = false;
  
  // 1 - on récupère les bonnes réponses
  const currentQ = room.questions[room.currentQuestion];
  const correctAnswer = currentQ.answer;

  // 2 - on trie les bonnes réponses par rapidité
  const goodAnswers = room.answers.filter(a => a.answer === correctAnswer).sort((a, b) => a.timeTaken - b.timeTaken);

  // 3 - attribution des points
  goodAnswers.forEach((a, idx) => {
    const player = room.players.find(p => p.id === a.playerId);
    if(!player) return;
    if(idx===0) player.score += 20;
    else if (idx===1) player.score += 15;
    else if (idx===2) player.score += 10;
    else player.score += 5;
  });

  // 4 - on envoie les résultats de la question à tous
  io.to(roomId).emit('questionResults', {
    correctAnswer: correctAnswer,
    answers: room.answers.map(a => ({
      playerId: a.playerId,
      playerName: room.players.find(p => p.id === a.playerId)?.pseudo || 'Joueur',
      answer: a.answer,
      isCorrect: a.answer === correctAnswer,
      timeTaken: a.timeTaken
    })),
    players: room.players.map(p=>({ pseudo: p.pseudo, score: p.score}))
  });

  // 5 - on passe à la question suivante ou on termine après 5 secondes
  setTimeout(() => {
    if(room.currentQuestion < room.questions.length - 1){
      room.currentQuestion++;
      sendQuestion(roomId);
    } else {
      // Trier le classement final par score décroissant
      const finalPlayers = room.players
        .map(p => ({ pseudo: p.pseudo, score: p.score }))
        .sort((a, b) => b.score - a.score);
      
      io.to(roomId).emit('gameOver', {
        players: finalPlayers
      });
    }
  }, 5000); // 5 secondes
}

// Fonction pour envoyer la question courante à tous les joueurs d'une room
function sendQuestion(roomId){
  const room = rooms.getRoom(roomId);
  if(!room) return;
  
  const question = room.questions[room.currentQuestion];
  io.to(roomId).emit('newQuestion', {
    question,
    index : room.currentQuestion,
    total: room.questions.length,
    timeLimit: 20 // 20 secondes
  });
  
  rooms.resetAnswers(roomId);
  
  // Définir le timeout pour cette question
  rooms.setQuestionTimeout(roomId, (roomId) => {
    processQuestionResults(roomId);
  });
}

server.listen(PORT, () => {
  console.log(`Serveur backend + socket.io démarré sur le port ${PORT}`);
});




// app.listen(PORT, () => {
//   console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
// });
