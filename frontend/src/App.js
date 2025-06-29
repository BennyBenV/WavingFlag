import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Header from './components/Header';
import QuizFlag from './components/QuizFlag';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home'; // à créer si besoin
import QuizSetup from './components/QuizSetup';
import Multiplayer from './components/Multiplayer';
// import CountriesList from './components/CoutriesList';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setProfilePic(user.photoURL);
      } else {
        setIsLoggedIn(false);
        setProfilePic(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} profilePic={profilePic} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<QuizFlag />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<QuizSetup />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
