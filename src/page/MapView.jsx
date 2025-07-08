import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { loadGoogleMaps, getApiKeyStatus } from '../utils/googleMapsLoader';
import { buildApiUrl, API_BASE_URL } from '../config/api';

const MapView = () => {
  const { id } = useParams();
  const [map, setMap] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKeyError, setApiKeyError] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRoutePanelMinimized, setIsRoutePanelMinimized] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const mapRef = useRef(null);
  const routePanelRef = useRef(null);
  const currentInfoWindowRef = useRef(null);

  useEffect(() => {
    fetchMapData();
  }, [id]);

  useEffect(() => {
    if (mapData) {
      // Check API key status first
      const apiKeyStatus = getApiKeyStatus();
      if (!apiKeyStatus.isValid) {
        setApiKeyError(apiKeyStatus);
        setLoading(false);
        return;
      }

      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [mapData]);

  // Handle click outside to close route panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRoute && routePanelRef.current && !routePanelRef.current.contains(event.target)) {
        // Don't close if clicking on the route button itself
        if (!event.target.closest('.route-btn')) {
          setShowRoute(false);
          setRouteInfo(null);
          if (directionsRenderer) {
            directionsRenderer.setMap(null);
          }
        }
      }
    };

    if (showRoute) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showRoute, directionsRenderer]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/maps/${id}`));
      
      if (!response.ok) {
        throw new Error('Map not found');
      }
      
      const data = await response.json();
      setMapData(data);
      setLikeCount(data.likes || 0);
      
      // Check if user has liked this map (if user is logged in)
      await checkLikeStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLiked(false);
        return;
      }

      const response = await fetch(buildApiUrl(`/api/maps/${id}/like-status`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
      }
    } catch (err) {
      console.error('Error checking like status:', err);
      setIsLiked(false);
    }
  };

  const initializeMap = async () => {
    try {
      if (!mapRef.current) {
        console.error('Map container element not found');
        setError('Map container not available');
        return;
      }

      const google = await loadGoogleMaps();
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { 
          lat: parseFloat(mapData.center_lat), 
          lng: parseFloat(mapData.center_lng) 
        },
        zoom: parseInt(mapData.zoom_level),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      setMap(mapInstance);

      // Initialize directions renderer
      const directionsRendererInstance = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use our custom markers
        polylineOptions: {
          strokeColor: '#FF6B35',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      setDirectionsRenderer(directionsRendererInstance);

      // Add markers if they exist
      if (mapData.markers && mapData.markers.length > 0) {
        mapData.markers.forEach(marker => {
          const markerInstance = new google.maps.Marker({
            position: { 
              lat: parseFloat(marker.latitude), 
              lng: parseFloat(marker.longitude) 
            },
            map: mapInstance,
            title: marker.name,
            icon: {
              url: marker.image_url ? `${API_BASE_URL}${marker.image_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjRkY2QjM1Ii8+Cjwvc3ZnPgo=',
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40)
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 15px; max-width: 300px; background: rgba(255, 255, 255, 0.9); border-radius: 10px; backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${marker.name}</h3>
                <p style="margin: 8px 0; color: #666; line-height: 1.4;">${marker.description || ''}</p>
                ${marker.image_url ? `
                  <img src="${API_BASE_URL}${marker.image_url}" 
                       alt="${marker.name}" 
                       style="width: 100%; max-width: 250px; height: auto; border-radius: 8px; margin-top: 10px;" />
                ` : ''}
              </div>
            `
          });

          markerInstance.addListener('click', () => {
            // Close any currently open info window
            if (currentInfoWindowRef.current) {
              currentInfoWindowRef.current.close();
            }
            
            // Open the new info window and track it
            infoWindow.open(mapInstance, markerInstance);
            currentInfoWindowRef.current = infoWindow;
          });
        });
      }

    } catch (err) {
      console.error('Error loading Google Maps:', err);
      if (err.message.includes('API key') || err.message.includes('placeholder')) {
        setApiKeyError(getApiKeyStatus());
      } else {
        setError('Failed to load map. Please try again.');
      }
    }
  };

  const createTourRoute = async () => {
    if (!map || !directionsRenderer || !mapData.markers || mapData.markers.length < 2) {
      return;
    }

    const google = window.google;
    const directionsService = new google.maps.DirectionsService();

    // Define optimal tour orders for predefined maps
    const tourOrders = {
      'Saigon Food Tour': [
        'Ben Thanh Market',
        'Nguyen Hue Walking Street', 
        'Pho 24',
        'Banh Mi Huynh Hoa',
        'Bui Vien Street',
        'Secret Garden',
        'Skydeck Bar'
      ],
      'Historical Landmarks of Hanoi': [
        'Hoan Kiem Lake',
        'Temple of Literature',
        'Ho Chi Minh Mausoleum'
      ],
      'Tokyo Highlights': [
        'Senso-ji Temple',
        'Tokyo Tower',
        'Shibuya Crossing'
      ]
    };

    // Get tour order for this map, or use default order (by order_index)
    const tourOrder = tourOrders[mapData.title];
    let sortedMarkers;

    if (tourOrder) {
      // Sort markers according to predefined tour order
      sortedMarkers = tourOrder.map(name => 
        mapData.markers.find(marker => 
          marker.name.toLowerCase().includes(name.toLowerCase())
        )
      ).filter(Boolean);
      
      // If predefined order doesn't match all markers, fall back to order_index
      if (sortedMarkers.length < mapData.markers.length) {
        console.log('Predefined order incomplete, using order_index for all markers');
        sortedMarkers = [...mapData.markers].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      }
    } else {
      // Default: sort by order_index for user-created maps
      sortedMarkers = [...mapData.markers].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }

    if (sortedMarkers.length < 2) {
      console.error('Not enough markers found for route');
      return;
    }

    // Create waypoints (all locations except first and last)
    const waypoints = sortedMarkers.slice(1, -1).map(marker => ({
      location: new google.maps.LatLng(
        parseFloat(marker.latitude), 
        parseFloat(marker.longitude)
      ),
      stopover: true
    }));

    const request = {
      origin: new google.maps.LatLng(
        parseFloat(sortedMarkers[0].latitude), 
        parseFloat(sortedMarkers[0].longitude)
      ),
      destination: new google.maps.LatLng(
        parseFloat(sortedMarkers[sortedMarkers.length - 1].latitude), 
        parseFloat(sortedMarkers[sortedMarkers.length - 1].longitude)
      ),
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.WALKING
    };

    try {
      const result = await new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      directionsRenderer.setDirections(result);
      directionsRenderer.setMap(map);
      
      // Calculate total distance and duration and create detailed route info
      let totalDistance = 0;
      let totalDuration = 0;
      const routeSteps = [];
      
      result.routes[0].legs.forEach((leg, legIndex) => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;
        
        // Add step information
        const fromLocation = legIndex === 0 ? sortedMarkers[0].name : sortedMarkers[legIndex].name;
        const toLocation = sortedMarkers[legIndex + 1].name;
        
        routeSteps.push({
          step: legIndex + 1,
          from: fromLocation,
          to: toLocation,
          distance: leg.distance.text,
          duration: leg.duration.text,
          instructions: leg.steps.map(step => step.instructions).join(' → ')
        });
      });

      const routeData = {
        totalDistance: (totalDistance/1000).toFixed(1),
        totalDuration: Math.round(totalDuration/60),
        steps: routeSteps,
        locations: sortedMarkers.map((marker, index) => ({
          order: index + 1,
          name: marker.name,
          description: marker.description
        })),
        mapTitle: mapData.title
      };
      
      setRouteInfo(routeData);
      console.log(`${mapData.title} route created: ${routeData.totalDistance}km, ${routeData.totalDuration} minutes walking`);
      
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  const toggleRoute = () => {
    if (showRoute) {
      // Hide route
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
      setShowRoute(false);
      setRouteInfo(null);
    } else {
      // Show route
      createTourRoute();
      setShowRoute(true);
    }
  };

  const handleLikeToggle = async () => {
    if (isLiking) return;
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to like maps!');
      return;
    }
    
    setIsLiking(true);
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(buildApiUrl(`/api/maps/${id}/like`), {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update like status');
      }
      
      const data = await response.json();
      setLikeCount(data.likes);
      setIsLiked(data.isLiked);
    } catch (err) {
      console.error('Error updating like status:', err);
      alert(err.message || 'Failed to update like status');
    } finally {
      setIsLiking(false);
    }
  };

  if (loading) {
    return (
      <div className="map-view-loading">
        <div className="loading-spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-view-error">
        <h2>Error Loading Map</h2>
        <p>{error}</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  if (apiKeyError) {
    return (
      <div className="map-view-error">
        <h2>Google Maps Configuration Required</h2>
        <div className="api-key-error-content">
          <p><strong>Issue:</strong> {apiKeyError.message}</p>
          <p><strong>Solution:</strong> {apiKeyError.instruction}</p>
          
          <div className="api-key-instructions">
            <h3>🔧 How to fix this:</h3>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the following APIs:
                <ul>
                  <li>Maps JavaScript API</li>
                  <li>Places API</li>
                  <li>Directions API</li>
                  <li>Geocoding API</li>
                </ul>
              </li>
              <li>Create an API key in the "Credentials" section</li>
              <li>Update your <code>.env</code> file with: <code>VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</code></li>
              <li>Restart your development server</li>
            </ol>
          </div>
          
          <div className="api-key-actions">
            <button onClick={() => window.history.back()}>Go Back</button>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view">
      <div className="map-view-header">
        <div className="map-view-info">
          <h1>{mapData.title}</h1>
          <p className="map-description">{mapData.description}</p>
          <div className="map-meta">
            <span className="map-author">
              Created by {mapData.author_name || 'Anonymous'}
            </span>
            <span className="map-date">
              {new Date(mapData.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="map-stats">
            <span className="stat-item">
              <span className="stat-icon">👁️</span>
              <span className="stat-value">{mapData.views || 0}</span>
              <span className="stat-label">views</span>
            </span>
            <span className="stat-item">
              <span className="stat-icon">❤️</span>
              <span className="stat-value">{likeCount}</span>
              <span className="stat-label">likes</span>
            </span>
          </div>
        </div>
        <div className="map-view-actions">
          <button 
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeToggle}
            disabled={isLiking}
          >
            {isLiking ? '⏳' : (isLiked ? '❤️' : '🤍')} 
            {isLiking ? 'Updating...' : (isLiked ? 'Liked' : 'Like')}
          </button>
          <button 
            className={`route-btn ${showRoute ? 'active' : ''}`}
            onClick={toggleRoute}
          >
            {showRoute ? '🗺️ Hide Route' : '🚶 Show Tour Route'}
          </button>
          <button 
            className="back-btn"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
        </div>
      </div>
      
      <div className="map-view-container">
        <div ref={mapRef} className="map-view-map"></div>
        
        {showRoute && routeInfo && (
          <div className={`route-info-panel ${isRoutePanelMinimized ? 'minimized' : ''}`} ref={routePanelRef}>
            <div className="route-summary">
              <div className="route-header">
                <h3>🚶 {routeInfo.mapTitle} Route</h3>
                <div className="route-header-buttons">
                  <button 
                    className="route-minimize-btn"
                    onClick={() => setIsRoutePanelMinimized(!isRoutePanelMinimized)}
                    title={isRoutePanelMinimized ? "Expand route panel" : "Minimize route panel"}
                  >
                    {isRoutePanelMinimized ? '⬆️' : '⬇️'}
                  </button>
                  <button 
                    className="route-close-btn"
                    onClick={() => {
                      setShowRoute(false);
                      setRouteInfo(null);
                      setIsRoutePanelMinimized(false);
                      if (directionsRenderer) {
                        directionsRenderer.setMap(null);
                      }
                    }}
                    title="Close route panel"
                  >
                    ×
                  </button>
                </div>
              </div>
              {!isRoutePanelMinimized && (
                <div className="route-stats">
                  <span className="stat">
                    <strong>Total Distance:</strong> {routeInfo.totalDistance} km
                  </span>
                  <span className="stat">
                    <strong>Walking Time:</strong> {routeInfo.totalDuration} minutes
                  </span>
                  <span className="stat">
                    <strong>Stops:</strong> {routeInfo.locations.length} locations
                  </span>
                </div>
              )}
            </div>
            
            {!isRoutePanelMinimized && (
              <>
                <div className="route-steps">
                  <h4>Step-by-Step Directions:</h4>
                  {routeInfo.steps.map((step, index) => (
                    <div key={index} className="route-step">
                      <div className="step-header">
                        <span className="step-number">{step.step}</span>
                        <div className="step-info">
                          <div className="step-route">
                            <strong>{step.from}</strong> → <strong>{step.to}</strong>
                          </div>
                          <div className="step-details">
                            {step.distance} • {step.duration}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="route-locations">
                  <h4>Tour Locations in Order:</h4>
                  {routeInfo.locations.map((location, index) => (
                    <div key={index} className="tour-location">
                      <span className="location-number">{location.order}</span>
                      <div className="location-info">
                        <strong>{location.name}</strong>
                        <p>{location.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {mapData.markers && mapData.markers.length > 0 && (
        <div className="map-markers-info">
          <h3>Locations on this map ({mapData.markers.length})</h3>
          <div className="markers-grid">
            {mapData.markers.map((marker, index) => (
              <div key={index} className="marker-card">
                {marker.image_url && (
                  <img 
                    src={`${API_BASE_URL}${marker.image_url}`} 
                    alt={marker.name}
                    className="marker-image"
                  />
                )}
                <div className="marker-info">
                  <h4>{marker.name}</h4>
                  <p>{marker.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView; 