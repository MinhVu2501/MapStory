import React, { useState, useEffect } from 'react';

const MyMapsPage = () => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyMaps = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your maps');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:3000/api/maps/my-maps', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMaps(data);
        } else {
          setError('Failed to fetch maps');
        }
      } catch (err) {
        setError('Network error');
        console.error('Error fetching maps:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyMaps();
  }, []);

  if (loading) {
    return <div>Loading your maps...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="my-maps-page">
      <h2>My Maps</h2>
      {maps.length === 0 ? (
        <p>You haven't created any maps yet.</p>
      ) : (
        <div className="maps-grid">
          {maps.map(map => (
            <div key={map.id} className="map-card">
              <h3>{map.title}</h3>
              <p>{map.description}</p>
              <p>Created: {new Date(map.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMapsPage; 