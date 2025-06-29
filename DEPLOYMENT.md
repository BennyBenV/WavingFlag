# 🚀 Guide de Déploiement - WavingFlag

## 📋 Prérequis
- Compte GitHub
- Node.js 16+ installé
- Compte sur la plateforme de déploiement choisie

## 🎯 Options de Déploiement

### Option 1: Vercel (Frontend) + Render (Backend) - RECOMMANDÉ

#### Frontend (Vercel)
1. **Préparer le projet**
   ```bash
   cd frontend
   npm run build
   ```

2. **Déployer sur Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```
   - Connecter ton compte GitHub
   - Choisir le dossier `frontend`
   - Build command: `npm run build`
   - Output directory: `build`

3. **Configurer les variables d'environnement**
   - Dans Vercel Dashboard → Settings → Environment Variables
   - Ajouter: `REACT_APP_API_URL=https://ton-backend-url.onrender.com`

#### Backend (Render)
1. **Connecter le repo GitHub**
   - Aller sur [render.com](https://render.com)
   - Créer un nouveau "Web Service"
   - Connecter ton repo GitHub

2. **Configuration**
   - **Name**: `wavingflag-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

3. **Variables d'environnement**
   - `NODE_ENV=production`
   - `PORT=10000`

### Option 2: Netlify (Frontend) + Railway (Backend)

#### Frontend (Netlify)
1. **Déployer via drag & drop**
   - Build: `npm run build`
   - Glisser le dossier `build` sur Netlify

2. **Ou via Git**
   - Connecter ton repo GitHub
   - Build command: `npm run build`
   - Publish directory: `build`

#### Backend (Railway)
1. **Connecter le repo**
   - Aller sur [railway.app](https://railway.app)
   - Créer un nouveau projet
   - Connecter ton repo GitHub

2. **Configuration**
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`

### Option 3: Heroku (Full Stack)

1. **Préparer Heroku**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Créer l'app**
   ```bash
   heroku create wavingflag-app
   ```

3. **Déployer**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

## 🔧 Configuration Post-Déploiement

### 1. Mettre à jour les URLs
Après avoir déployé, mettre à jour les URLs dans le code :

**Frontend (Multiplayer.jsx et QuizFlag.jsx)**
```javascript
// Remplacer les URLs par celles de ton backend
const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://ton-backend-url.onrender.com/api/countries'
  : 'http://localhost:3001/api/countries';
```

**Backend (index.js)**
```javascript
// Remplacer par l'URL de ton frontend
origin: ['https://ton-frontend-url.vercel.app']
```

### 2. Tester la connexion
- Vérifier que l'API répond: `https://ton-backend-url.com/`
- Tester le multijoueur avec 2 onglets
- Vérifier les logs du backend

## 🐛 Dépannage

### Problèmes courants
1. **CORS errors**: Vérifier les origines autorisées dans le backend
2. **Socket.IO ne fonctionne pas**: Vérifier les URLs WebSocket
3. **API ne répond pas**: Vérifier les variables d'environnement

### Logs utiles
```bash
# Backend logs
heroku logs --tail
# ou dans Render/Railway dashboard
```

## 📱 Domaines personnalisés (Optionnel)
- **Vercel**: Settings → Domains → Add Domain
- **Netlify**: Domain Management → Add Custom Domain
- **Render**: Settings → Custom Domains

## 💰 Coûts estimés
- **Vercel**: Gratuit (limite: 100GB/mois)
- **Netlify**: Gratuit (limite: 100GB/mois)
- **Render**: Gratuit (limite: 750h/mois)
- **Railway**: Gratuit (limite: 500h/mois)
- **Heroku**: Payant (pas de tier gratuit)

## 🎉 Félicitations !
Ton app WavingFlag est maintenant en ligne ! 🚩 