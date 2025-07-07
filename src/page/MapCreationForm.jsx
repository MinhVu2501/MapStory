// mapstory/src/pages/MapCreationForm.jsx

import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // No longer needed if rendered within Home

// Add onSuccess and onCancel props
const MapCreationForm = ({ mapInstance, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true); // Default to public
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [currentMapCenter, setCurrentMapCenter] = useState({ lat: null, lng: null });
  const [currentMapZoom, setCurrentMapZoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // const navigate = useNavigate(); // No longer needed if rendered within Home

  // Effect to get current map center and zoom when mapInstance is available
  useEffect(() => {
    if (mapInstance) {
      const updateMapState = () => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        setCurrentMapCenter({ lat: center.lat(), lng: center.lng() });
        setCurrentMapZoom(zoom);
      };

      // Initial update
      updateMapState();

      // Add listener for map changes
      const idleListener = mapInstance.addListener('idle', updateMapState);

      // Cleanup listener on unmount
      return () => {
        if (idleListener) {
          window.google.maps.event.removeListener(idleListener);
        }
      };
    }
  }, [mapInstance]);

  const validateForm = () => {
    if (!title.trim()) {
      setError('Map title is required.');
      return false;
    }
    if (title.trim().length < 3) {
      setError('Map title must be at least 3 characters long.');
      return false;
    }
    if (title.trim().length > 100) {
      setError('Map title must be less than 100 characters.');
      return false;
    }
    if (description.trim().length > 500) {
      setError('Description must be less than 500 characters.');
      return false;
    }
    if (thumbnailUrl.trim() && !isValidUrl(thumbnailUrl.trim())) {
      setError('Please enter a valid URL for the thumbnail image.');
      return false;
    }
    if (currentMapCenter.lat === null || currentMapCenter.lng === null || currentMapZoom === null) {
      setError('Map center and zoom could not be determined. Please ensure the map is loaded.');
      return false;
    }
    return true;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!token || !user || !user.id) {
        setError('You must be logged in to create a map.');
        setLoading(false);
        onCancel();
        return;
      }

      const response = await fetch('http://localhost:3001/api/maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim(),
          description: description.trim(),
          isPublic,
          centerLat: currentMapCenter.lat,
          centerLng: currentMapCenter.lng,
          zoomLevel: currentMapZoom,
          thumbnailUrl: thumbnailUrl.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTitle('');
        setDescription('');
        setIsPublic(true);
        setThumbnailUrl('');
        
        // Show success message briefly before calling onSuccess
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.message || 'Failed to create map.');
        console.error('API Error:', data);
      }
    } catch (err) {
      setError('Network error. Could not connect to the server.');
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="map-creation-form-wrapper success-state">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Map Created Successfully!</h2>
          <p>Your map story has been created and saved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-creation-form-wrapper">
      <div className="form-header">
        <h2>Create New Map Story</h2>
        <button 
          type="button" 
          onClick={onCancel} 
          className="close-button"
          disabled={loading}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="map-creation-form">
        <div className="form-group">
          <label htmlFor="title">
            Map Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title for your map"
            required
            disabled={loading}
            maxLength={100}
          />
          <small className="char-count">{title.length}/100</small>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            placeholder="Describe your map story (optional)"
            disabled={loading}
            maxLength={500}
          ></textarea>
          <small className="char-count">{description.length}/500</small>
        </div>

        <div className="form-group">
          <label htmlFor="thumbnailUrl">Thumbnail Image URL</label>
          <input
            type="url"
            id="thumbnailUrl"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={loading}
          />
          <small className="form-help">Optional: Add a thumbnail image for your map</small>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={loading}
            />
            <span className="checkmark"></span>
            Make this map public
          </label>
          <small className="form-help">
            Public maps can be viewed by anyone. Private maps are only visible to you.
          </small>
        </div>

        <div className="map-coordinates-display">
          <h4>Current Map View</h4>
          <div className="coordinates-grid">
            <div className="coordinate-item">
              <span className="label">Latitude:</span>
              <span className="value">
                {currentMapCenter.lat !== null ? currentMapCenter.lat.toFixed(6) : 'Loading...'}
              </span>
            </div>
            <div className="coordinate-item">
              <span className="label">Longitude:</span>
              <span className="value">
                {currentMapCenter.lng !== null ? currentMapCenter.lng.toFixed(6) : 'Loading...'}
              </span>
            </div>
            <div className="coordinate-item">
              <span className="label">Zoom Level:</span>
              <span className="value">
                {currentMapZoom !== null ? currentMapZoom : 'Loading...'}
              </span>
            </div>
          </div>
          <small className="form-help">
            Adjust the map in the background to set the initial view for your story.
          </small>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !mapInstance} 
            className="submit-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Map...
              </>
            ) : (
              'Create Map Story'
            )}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={loading} 
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MapCreationForm;