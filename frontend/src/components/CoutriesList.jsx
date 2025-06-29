import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CountriesList() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_API_URL + '/api/countries'
      : 'http://localhost:3001/api/countries';
    
    axios.get(apiUrl)
      .then(response => {
        setCountries(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des pays :', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h2>Liste des pays et leurs drapeaux</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {countries.map((country, idx) => (
          <li key={idx} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
            <img src={country.flag} alt={`Drapeau de ${country.name}`} width="50" style={{ marginRight: '10px' }} />
            {country.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CountriesList;
