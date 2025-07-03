import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { updateProfile, signOut } from 'firebase/auth';
import '../styles/Profile.scss';

function Profile() {
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(user, {
        displayName,
        photoURL: photoURL || null
      });
      setMessage('Profil mis à jour !');
    } catch (err) {
      setMessage("Erreur lors de la mise à jour du profil");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <div className="profile-container">
      <h2>Mon profil</h2>
      <form className="profile-form" onSubmit={handleSave}>
        <div className="profile-avatar-block">
          <img
            src={photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName || 'User')}
            alt="Avatar"
            className="profile-avatar"
          />
          <input
            type="url"
            placeholder="URL de la photo (optionnel)"
            value={photoURL}
            onChange={e => setPhotoURL(e.target.value)}
            className="profile-input"
          />
        </div>
        <div className="profile-field">
          <label>Pseudo</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="profile-input"
            required
          />
        </div>
        <div className="profile-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="profile-input profile-input-disabled"
          />
        </div>
        <button type="submit" className="profile-btn" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" className="profile-btn logout" onClick={handleLogout}>
          Se déconnecter
        </button>
        {message && <div className="profile-message">{message}</div>}
      </form>
    </div>
  );
}

export default Profile; 