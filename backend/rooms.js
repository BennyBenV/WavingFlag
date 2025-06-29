const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // pour appeler l'API REST Countries

const rooms = {};

//Création d'une room
function createRoom(pseudo, socketId) {
    const roomId = 'room-' + uuidv4().slice(0,6);
    rooms[roomId] = {
        players : [{ id: socketId, pseudo, score : 0}],
        started : false,
        currentQuestion : 0,
        questions : [],
        answers : [],
        questionStartTime : null,
        questionTimeout: null,
        questionInProgress: false
    };
    return roomId;
}

//Joindre une room
function joinRoom(roomId, pseudo, socketId){
    if (!rooms[roomId]) return false;
    rooms[roomId].players.push({id : socketId, pseudo, score : 0 });
    return true;
}

//Supprimer un joueur d'une room
function removePlayer(socketId){
    for (const roomId in rooms){
        const room = rooms[roomId];
        room.players = room.players.filter(p => p.id !== socketId);
        //Supprime la room si plus aucun joueur
        if(room.players.length === 0){
            delete rooms[roomId];
        }
    }
}

// Nouvelle fonction pour générer les questions QCM
async function generateQuestions(count = 10) {
  try {
    const apiUrl = process.env.REST_COUNTRIES_API || 'https://restcountries.com/v3.1/all?fields=name,flags,continents,capital,translations';
    const response = await axios.get(apiUrl);
    const countries = response.data;
    
    // Mélanger et sélectionner 'count' pays
    const shuffled = countries.sort(() => Math.random() - 0.5).slice(0, count);
    
    // Générer les questions QCM
    const questions = shuffled.map((country) => {
      // Trouver 3 mauvaises réponses aléatoires
      const others = countries.filter(c => c.name !== country.name);
      const wrongChoices = others.sort(() => Math.random() - 0.5).slice(0, 3);
      
      // Mélanger les 4 choix
      const choices = [
        { name: country.name, isCorrect: true },
        ...wrongChoices.map(c => ({ name: c.name, isCorrect: false }))
      ].sort(() => Math.random() - 0.5);
      
      return {
        flag: country.flag,
        answer: country.name,
        choices: choices
      };
    });
    
    return questions;
  } catch (error) {
    console.error('Erreur lors de la génération des questions:', error);
    return [];
  }
}

// Modifier la fonction startGame pour générer les questions
async function startGame(roomId) {
  if (!rooms[roomId]) return false;
  
  const questions = await generateQuestions(10); // 10 questions par défaut
  if (questions.length === 0) return false;
  
  rooms[roomId].started = true;
  rooms[roomId].questions = questions;
  rooms[roomId].currentQuestion = 0;
  rooms[roomId].answers = [];
  rooms[roomId].questionStartTime = Date.now();
  rooms[roomId].questionInProgress = false;
  return true;
}

//Récupérer une room
function getRoom(roomId){
    return rooms[roomId];
}

//Récupérer toutes les rooms
function getAllRooms(){
    return rooms;
}

//Ajouter une réponse à une room
function addAnswer(roomId, playerId, answer, timeTaken){
    if(!rooms[roomId]) return;
    
    // Éviter les réponses multiples du même joueur
    const existingAnswer = rooms[roomId].answers.find(a => a.playerId === playerId);
    if (existingAnswer) return;
    
    rooms[roomId].answers.push({ playerId, answer, timeTaken });
}

//Réinitialiser les réponses d'une room
function resetAnswers(roomId){
    if(!rooms[roomId]) return;
    rooms[roomId].answers = [];
    rooms[roomId].questionStartTime = Date.now();
    rooms[roomId].questionInProgress = true;
}

function setQuestionTimeout(roomId, callback) {
  if (!rooms[roomId]) return;
  
  // Clear timeout précédent s'il existe
  if (rooms[roomId].questionTimeout) {
    clearTimeout(rooms[roomId].questionTimeout);
  }
  
  // Nouveau timeout de 20 secondes
  rooms[roomId].questionTimeout = setTimeout(() => {
    callback(roomId);
  }, 20000); // 20 secondes
}

function clearQuestionTimeout(roomId) {
  if (!rooms[roomId] || !rooms[roomId].questionTimeout) return;
  clearTimeout(rooms[roomId].questionTimeout);
  rooms[roomId].questionTimeout = null;
}

module.exports = {
    createRoom,
    joinRoom,
    removePlayer,
    startGame,
    getRoom,
    getAllRooms,
    addAnswer,
    resetAnswers,
    setQuestionTimeout,
    clearQuestionTimeout
}