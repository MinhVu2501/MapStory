import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyMapsPage = () => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserMaps = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user')); // Get user object from localStorage

        if (!token || !user || !user.id) {
          setError('You must be logged in to view your maps.');
          setLoading(false);
          // Redirect to login if not authenticated
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:3000/api/maps?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Send token for authentication
          },
        });

        const data = await response.json();

        if (response.ok) {
          setMaps(data);
        } else {
          setError(data.message || 'Failed to fetch maps.');
          console.error('API Error:', data);
        }
      } catch (err) {
        setError('Network error. Could not connect to the server or an unexpected error occurred.');
        console.error('Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMaps();
  }, [navigate]); // Depend on navigate to avoid lint warnings

  if (loading) {
    return <div className="my-maps-container">Loading maps...</div>;
  }

  if (error) {
    return <div className="my-maps-container" style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className="my-maps-container">
      <h2>My Maps</h2>
      <button onClick={() => navigate('/create-map')} className="create-map-button">
        Create New Map
      </button>

      {maps.length === 0 ? (
        <p>You haven't created any maps yet. Click "Create New Map" to get started!</p>
      ) : (
        <div className="maps-grid">
          {maps.map((map) => (
            <div key={map.id} className="map-card" onClick={() => navigate(`/map/${map.id}`)}>
              {map.thumbnail_url && (
                <img src={map.thumbnail_url} alt={map.title} className="map-thumbnail" />
              )}
              <h3>{map.title}</h3>
              <p>{map.description}</p>
              <div className="map-meta">
                <span>{map.is_public ? 'Public' : 'Private'}</span>
                <span>Updated: {new Date(map.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMapsPage;