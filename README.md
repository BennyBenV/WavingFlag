# WavingFlag

WavingFlag est un site de quiz sur les drapeaux du monde, avec un mode solo et un mode multijoueur en temps réel.

## Fonctionnalités principales
- Quiz sur les drapeaux avec choix du continent et du nombre de questions
- Mode multijoueur en temps réel (création et rejoint de parties)
- Classement en direct et affichage des scores
- Interface moderne, responsive et colorée
- Authentification (Firebase)

## Installation

1. **Cloner le dépôt**
```bash
git clone <url-du-repo>
cd WavingFlag
```

2. **Installer les dépendances**

Pour le backend :
```bash
cd backend
npm install
```
Pour le frontend :
```bash
cd ../frontend
npm install
```

3. **Configurer les variables d'environnement**
- Backend : créer un fichier `.env` dans `backend/` (voir `.env.example` si présent)
- Frontend : configurer les accès Firebase dans `src/firebase.js`

4. **Lancer le projet**

Dans deux terminaux séparés :
- Backend :
```bash
cd backend
npm start
```
- Frontend :
```bash
cd frontend
npm start
```

Le site est accessible sur https://waving-flag-git-master-bennybenvs-projects.vercel.app/

## Utilisation
- **Mode solo** : choisissez un continent, le nombre de questions, et testez vos connaissances sur les drapeaux !
- **Mode multijoueur** : créez ou rejoignez une partie, affrontez vos amis en temps réel, et grimpez dans le classement !

## Technologies utilisées
- React, SCSS, Socket.io, Node.js, Express, Firebase, REST Countries API

## Auteur
- Réalisé par [Votre Nom]

---

# Description rapide du site

WavingFlag est un site de quiz ludique et éducatif sur les drapeaux du monde. Il propose un mode solo personnalisable et un mode multijoueur en temps réel où vous pouvez défier vos amis. L'interface est moderne, colorée et responsive, avec un classement dynamique et des options de jeu variées (nombre de questions, continent, etc.). Idéal pour apprendre en s'amusant ou pour organiser des défis entre amis ! 