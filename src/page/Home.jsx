import React, { useState, useEffect } from 'react';

const Home = () => {
  const [backendMessage, setBackendMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
  
    const API_URL = 'http://localhost:3000/';

    console.log("Attempting to fetch from backend:", API_URL);

    fetch(API_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        setBackendMessage(data);
        setError(null);
        console.log("Successfully fetched from backend:", data);
      })
      .catch(err => {
        console.error("Error fetching from backend:", err);
        setError("Failed to connect to backend: " + err.message);
        setBackendMessage('');
      });
  }, []); 

  return (
    <div className="home-page">
      <h2>Welcome to MapStory Creator!</h2>
      <p>Your platform for creating and sharing interactive map stories.</p>


      {error && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</p>
      )}

      <p>Start by exploring public maps or create your own!</p>
     
    </div>
  );
};

export default Home;