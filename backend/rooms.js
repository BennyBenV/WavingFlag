const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // pour appeler l'API REST Countries

const rooms = {};

//Création d'une room
function createRoom(pseudo, socketId, gameSettings = { questionCount: 10, continent: 'all' }) {
    const roomId = 'room-' + uuidv4().slice(0,6);
    rooms[roomId] = {
        players : [{ id: socketId, pseudo, score : 0, isCreator: true }],
        started : false,
        currentQuestion : 0,
        questions : [],
        answers : [],
        questionStartTime : null,
        questionTimeout: null,
        questionInProgress: false,
        gameSettings: gameSettings,
        creatorId: socketId
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
async function generateQuestions(count = 10, continent = 'all') {
  try {
    const apiUrl = process.env.REST_COUNTRIES_API || 'https://restcountries.com/v3.1/all?fields=name,flags,continents,capital,translations';
    const response = await axios.get(apiUrl);
    let countries = response.data;
    
    // Filtrer par continent si spécifié
    if (continent && continent !== 'all') {
      countries = countries.filter(country => 
        country.continents && country.continents.includes(continent)
      );
    }
    
    // Vérifier qu'on a assez de pays
    if (countries.length < count) {
      console.warn(`Pas assez de pays pour le continent ${continent}, utilisation de tous les pays`);
      const allCountriesResponse = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags,continents,capital,translations');
      countries = allCountriesResponse.data;
    }
    
    // Mélanger et sélectionner 'count' pays
    const shuffled = countries.sort(() => Math.random() - 0.5).slice(0, count);
    
    // Générer les questions QCM
    const questions = shuffled.map((country) => {
      // Utiliser la traduction française si disponible, sinon le nom commun
      const countryName = country.translations?.fra?.common || country.name.common;
      
      // Trouver 3 mauvaises réponses aléatoires
      const others = countries.filter(c => c.name.common !== country.name.common);
      const wrongChoices = others.sort(() => Math.random() - 0.5).slice(0, 3);
      
      // Mélanger les 4 choix avec traductions françaises
      const choices = [
        { name: countryName, isCorrect: true },
        ...wrongChoices.map(c => ({ 
          name: c.translations?.fra?.common || c.name.common, 
          isCorrect: false 
        }))
      ].sort(() => Math.random() - 0.5);
      
      return {
        flag: country.flags.svg,
        answer: countryName,
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
  
  const room = rooms[roomId];
  const settings = room.gameSettings || { questionCount: 10, continent: 'all' };
  
  const questions = await generateQuestions(settings.questionCount, settings.continent);
  if (questions.length === 0) return false;
  
  room.started = true;
  room.questions = questions;
  room.currentQuestion = 0;
  room.answers = [];
  room.questionStartTime = Date.now();
  room.questionInProgress = false;
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

// Mettre à jour les paramètres de jeu
function updateGameSettings(roomId, socketId, newSettings) {
  if (!rooms[roomId]) return false;
  
  const room = rooms[roomId];
  
  // Vérifier que c'est le créateur qui fait la modification
  if (room.creatorId !== socketId) return false;
  
  room.gameSettings = {
    ...room.gameSettings,
    ...newSettings
  };
  
  return true;
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
    clearQuestionTimeout,
    updateGameSettings
}