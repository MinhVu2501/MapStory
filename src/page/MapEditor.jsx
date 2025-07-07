import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import { buildApiUrl } from '../config/api';

const MapEditor = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapSettings, setMapSettings] = useState({
    title: '',
    description: '',
    isPublic: false,
    theme: 'default',
    walkthrough: false
  });
  const [sidebarTab, setSidebarTab] = useState('markers'); // 'markers', 'settings', or 'route'
  const [markerIcons] = useState([
    { id: 'default', icon: '📍', name: 'Default' },
    { id: 'food', icon: '🍽️', name: 'Food' },
    { id: 'hotel', icon: '🏨', name: 'Hotel' },
    { id: 'tourist', icon: '🏛️', name: 'Tourist' },
    { id: 'nature', icon: '🌿', name: 'Nature' },
    { id: 'shopping', icon: '🛍️', name: 'Shopping' },
    { id: 'transport', icon: '🚗', name: 'Transport' },
    { id: 'photo', icon: '📸', name: 'Photo' }
  ]);
  const [markerColors] = useState([
    { id: 'red', color: '#ff4444', name: 'Red' },
    { id: 'blue', color: '#4444ff', name: 'Blue' },
    { id: 'green', color: '#44ff44', name: 'Green' },
    { id: 'yellow', color: '#ffff44', name: 'Yellow' },
    { id: 'purple', color: '#ff44ff', name: 'Purple' },
    { id: 'orange', color: '#ff8844', name: 'Orange' },
    { id: 'pink', color: '#ff88cc', name: 'Pink' },
    { id: 'cyan', color: '#44ffff', name: 'Cyan' }
  ]);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      initializeMap();
    }, 100);
  }, []);

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      if (!mapRef.current) {
        console.error('Map container element not found');
        setLoading(false);
        return;
      }

      const google = await loadGoogleMaps();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 21.0285, lng: 105.8542 }, // Hanoi, Vietnam
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: getMapTheme('default')
      });

      setMap(mapInstance);

      // Initialize directions renderer for route preview
      const directionsRendererInstance = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use our custom markers
        polylineOptions: {
          strokeColor: '#FF6B35',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      setDirectionsRenderer(directionsRendererInstance);

      // Add click listener for adding markers
      mapInstance.addListener('click', (event) => {
        if (isAddingMarker) {
          addMarker(event.latLng, mapInstance, google);
          setIsAddingMarker(false);
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }
  };

  const getMapTheme = (theme) => {
    const themes = {
      default: [],
      dark: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] }
      ],
      retro: [
        { elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] }
      ],
      silver: [
        { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] }
      ]
    };
    return themes[theme] || themes.default;
  };

  const addMarker = (latLng, mapInstance, google) => {
    const newMarker = {
      id: Date.now().toString(),
      position: {
        lat: latLng.lat(),
        lng: latLng.lng()
      },
      title: `Point ${markers.length + 1}`,
      description: '',
      imageUrl: '',
      link: '',
      icon: 'default',
      color: 'red',
      order: markers.length + 1
    };

    // Create Google Maps marker
    const googleMarker = new google.maps.Marker({
      position: latLng,
      map: mapInstance,
      title: newMarker.title,
      draggable: true,
      icon: createMarkerIcon(newMarker.icon, newMarker.color)
    });

    // Add click listener to marker
    googleMarker.addListener('click', () => {
      setSelectedMarker(newMarker);
      setSidebarTab('markers');
    });

    // Add drag listener to update position
    googleMarker.addListener('dragend', (event) => {
      updateMarkerPosition(newMarker.id, {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      });
    });

    newMarker.googleMarker = googleMarker;
    setMarkers([...markers, newMarker]);
    setSelectedMarker(newMarker);
  };

  const createMarkerIcon = (iconType, color) => {
    const iconMap = markerIcons.find(i => i.id === iconType);
    const colorMap = markerColors.find(c => c.id === color);
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="${colorMap?.color || '#ff4444'}" stroke="white" stroke-width="2"/>
          <text x="16" y="20" text-anchor="middle" font-size="12" fill="white">${iconMap?.icon || '📍'}</text>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16)
    };
  };

  const updateMarkerPosition = (markerId, newPosition) => {
    setMarkers(markers.map(marker => 
      marker.id === markerId 
        ? { ...marker, position: newPosition }
        : marker
    ));
  };

  const updateMarker = (markerId, updates) => {
    setMarkers(markers.map(marker => {
      if (marker.id === markerId) {
        const updatedMarker = { ...marker, ...updates };
        
        // Update Google Maps marker
        if (marker.googleMarker) {
          marker.googleMarker.setTitle(updatedMarker.title);
          if (updates.icon || updates.color) {
            marker.googleMarker.setIcon(createMarkerIcon(updatedMarker.icon, updatedMarker.color));
          }
        }
        
        return updatedMarker;
      }
      return marker;
    }));

    // Update selected marker if it's the one being updated
    if (selectedMarker && selectedMarker.id === markerId) {
      setSelectedMarker({ ...selectedMarker, ...updates });
    }
  };

  const deleteMarker = (markerId) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker && marker.googleMarker) {
      marker.googleMarker.setMap(null);
    }
    
    setMarkers(markers.filter(m => m.id !== markerId));
    
    if (selectedMarker && selectedMarker.id === markerId) {
      setSelectedMarker(null);
    }
  };

  const reorderMarkers = (fromIndex, toIndex) => {
    const newMarkers = [...markers];
    const [removed] = newMarkers.splice(fromIndex, 1);
    newMarkers.splice(toIndex, 0, removed);
    
    // Update order numbers
    const reorderedMarkers = newMarkers.map((marker, index) => ({
      ...marker,
      order: index + 1
    }));
    
    setMarkers(reorderedMarkers);
  };

  const saveMap = async () => {
    if (!mapSettings.title.trim()) {
      alert('Please enter a map name');
      return;
    }

    if (markers.length === 0) {
      alert('Please add at least one marker to your map');
      return;
    }

    setSaving(true);
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to save your map');
        return;
      }

      // Calculate map center based on markers
      const centerLat = markers.reduce((sum, marker) => sum + marker.position.lat, 0) / markers.length;
      const centerLng = markers.reduce((sum, marker) => sum + marker.position.lng, 0) / markers.length;

      // Create map first
      const mapData = {
        title: mapSettings.title,
        description: mapSettings.description,
        isPublic: mapSettings.isPublic,
        centerLat: centerLat,
        centerLng: centerLng,
        zoomLevel: 12,
        thumbnailUrl: null
      };

      const mapResponse = await fetch(buildApiUrl('/api/maps'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(mapData)
      });

      if (!mapResponse.ok) {
        throw new Error('Failed to create map');
      }

      const createdMap = await mapResponse.json();
      console.log('Map created:', createdMap);

      // Create markers for the map
      const markerPromises = markers.map(marker => 
        fetch(buildApiUrl('/api/markers'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            mapId: createdMap.id,
            name: marker.title,
            description: marker.description,
            latitude: marker.position.lat,
            longitude: marker.position.lng,
            imageUrl: marker.imageUrl || null,
            orderIndex: marker.order
          })
        })
      );

      const markerResults = await Promise.all(markerPromises);
      const failedMarkers = markerResults.filter(response => !response.ok);
      
      if (failedMarkers.length > 0) {
        console.warn(`${failedMarkers.length} markers failed to save`);
      }

      alert('Map saved successfully! 🎉');
      console.log('Map and markers saved successfully');
      
      // Optionally redirect to the created map
      // window.location.href = `/map/${createdMap.id}`;
      
    } catch (error) {
      console.error('Error saving map:', error);
      alert('Failed to save map. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const previewRoute = async () => {
    if (!map || !directionsRenderer || markers.length < 2) {
      alert('You need at least 2 markers to create a route');
      return;
    }

    const google = window.google;
    const directionsService = new google.maps.DirectionsService();

    // Sort markers by order
    const sortedMarkers = [...markers].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Create waypoints (all locations except first and last)
    const waypoints = sortedMarkers.slice(1, -1).map(marker => ({
      location: new google.maps.LatLng(
        parseFloat(marker.position.lat), 
        parseFloat(marker.position.lng)
      ),
      stopover: true
    }));

    const request = {
      origin: new google.maps.LatLng(
        parseFloat(sortedMarkers[0].position.lat), 
        parseFloat(sortedMarkers[0].position.lng)
      ),
      destination: new google.maps.LatLng(
        parseFloat(sortedMarkers[sortedMarkers.length - 1].position.lat), 
        parseFloat(sortedMarkers[sortedMarkers.length - 1].position.lng)
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

      if (showRoutePreview) {
        // Hide route
        directionsRenderer.setMap(null);
        setShowRoutePreview(false);
        setRouteInfo(null);
      } else {
        // Show route
        directionsRenderer.setDirections(result);
        directionsRenderer.setMap(map);
        setShowRoutePreview(true);

        // Calculate route info
        let totalDistance = 0;
        let totalDuration = 0;
        
        result.routes[0].legs.forEach((leg) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });

        setRouteInfo({
          totalDistance: (totalDistance/1000).toFixed(1),
          totalDuration: Math.round(totalDuration/60),
          stops: sortedMarkers.length
        });
      }
    } catch (error) {
      console.error('Error creating route preview:', error);
      alert('Failed to create route preview. Please check your markers.');
    }
  };

  const previewMap = () => {
    // Open preview in new tab
    window.open('/preview', '_blank');
  };

  if (loading) {
    return (
      <div className="map-editor-loading">
        <div className="loading-spinner"></div>
        <p>Loading map editor...</p>
      </div>
    );
  }

  return (
    <div className="map-editor">
      {/* Header */}
      <header className="map-editor-header">
        <div className="header-left">
          <h1>📝 Map Editor</h1>
          <span className="map-title-preview">
            {mapSettings.title || 'Untitled Map'}
          </span>
        </div>
        <div className="header-actions">
          <button 
            className={`add-marker-btn ${isAddingMarker ? 'active' : ''}`}
            onClick={() => setIsAddingMarker(!isAddingMarker)}
          >
            {isAddingMarker ? '✋ Cancel' : '📍 Add Point'}
          </button>
          <button className="preview-btn" onClick={previewMap}>
            👁️ Preview
          </button>
          <button 
            className="save-btn" 
            onClick={saveMap}
            disabled={saving}
          >
            {saving ? '💾 Saving...' : '💾 Save Map'}
          </button>
        </div>
      </header>

      <div className="map-editor-content">
        {/* Sidebar */}
        <aside className="map-editor-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`sidebar-tab ${sidebarTab === 'markers' ? 'active' : ''}`}
              onClick={() => setSidebarTab('markers')}
            >
              📍 Markers ({markers.length})
            </button>
            <button 
              className={`sidebar-tab ${sidebarTab === 'route' ? 'active' : ''}`}
              onClick={() => setSidebarTab('route')}
            >
              🚶 Route
            </button>
            <button 
              className={`sidebar-tab ${sidebarTab === 'settings' ? 'active' : ''}`}
              onClick={() => setSidebarTab('settings')}
            >
              ⚙️ Settings
            </button>
          </div>

          <div className="sidebar-content">
            {sidebarTab === 'markers' && (
              <div className="markers-panel">
                <div className="markers-list">
                  <h3>Markers List</h3>
                  {markers.length === 0 ? (
                    <div className="empty-markers">
                      <p>No markers yet</p>
                      <p>Click "Add Point" then click on the map to add your first marker</p>
                    </div>
                  ) : (
                    <div className="markers-items">
                      {markers.map((marker, index) => (
                        <div 
                          key={marker.id} 
                          className={`marker-item ${selectedMarker?.id === marker.id ? 'selected' : ''}`}
                          onClick={() => setSelectedMarker(marker)}
                        >
                          <div className="marker-item-header">
                            <span className="marker-icon">
                              {markerIcons.find(i => i.id === marker.icon)?.icon || '📍'}
                            </span>
                            <span className="marker-title">
                              {marker.title || `Point ${index + 1}`}
                            </span>
                            <button 
                              className="delete-marker-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMarker(marker.id);
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                          <div className="marker-item-info">
                            <span className="marker-order">#{marker.order}</span>
                            <span className="marker-coords">
                              {marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedMarker && (
                  <div className="marker-editor">
                    <h3>Edit Marker</h3>
                    <div className="marker-form">
                      <div className="form-group">
                        <label>Point Name:</label>
                        <input
                          type="text"
                          value={selectedMarker.title}
                          onChange={(e) => updateMarker(selectedMarker.id, { title: e.target.value })}
                          placeholder="Enter point name..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Description:</label>
                        <textarea
                          value={selectedMarker.description}
                          onChange={(e) => updateMarker(selectedMarker.id, { description: e.target.value })}
                          placeholder="Enter detailed description..."
                          rows="3"
                        />
                      </div>

                      <div className="form-group">
                        <label>Image URL:</label>
                        <input
                          type="url"
                          value={selectedMarker.imageUrl}
                          onChange={(e) => updateMarker(selectedMarker.id, { imageUrl: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                        {selectedMarker.imageUrl && (
                          <div className="image-preview">
                            <img src={selectedMarker.imageUrl} alt="Preview" />
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Link (optional):</label>
                        <input
                          type="url"
                          value={selectedMarker.link}
                          onChange={(e) => updateMarker(selectedMarker.id, { link: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>

                      <div className="form-group">
                        <label>Icon:</label>
                        <div className="icon-selector">
                          {markerIcons.map(icon => (
                            <button
                              key={icon.id}
                              className={`icon-btn ${selectedMarker.icon === icon.id ? 'selected' : ''}`}
                              onClick={() => updateMarker(selectedMarker.id, { icon: icon.id })}
                              title={icon.name}
                            >
                              {icon.icon}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Color:</label>
                        <div className="color-selector">
                          {markerColors.map(color => (
                            <button
                              key={color.id}
                              className={`color-btn ${selectedMarker.color === color.id ? 'selected' : ''}`}
                              style={{ backgroundColor: color.color }}
                              onClick={() => updateMarker(selectedMarker.id, { color: color.id })}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sidebarTab === 'route' && (
              <div className="route-panel">
                <h3>Route Settings</h3>
                <div className="route-info">
                  <p>Create a walking route connecting your markers in order.</p>
                  <p>Current markers: {markers.length}</p>
                  {markers.length < 2 && (
                    <p className="route-warning">⚠️ You need at least 2 markers to create a route</p>
                  )}
                </div>

                {markers.length >= 2 && (
                  <div className="route-actions">
                    <button 
                      className={`route-preview-btn ${showRoutePreview ? 'active' : ''}`}
                      onClick={previewRoute}
                    >
                      {showRoutePreview ? '🗺️ Hide Route Preview' : '🚶 Show Route Preview'}
                    </button>
                    
                    {routeInfo && (
                      <div className="route-stats">
                        <h4>Route Information:</h4>
                        <div className="route-stat">
                          <span className="stat-label">Total Distance:</span>
                          <span className="stat-value">{routeInfo.totalDistance} km</span>
                        </div>
                        <div className="route-stat">
                          <span className="stat-label">Walking Time:</span>
                          <span className="stat-value">{routeInfo.totalDuration} minutes</span>
                        </div>
                        <div className="route-stat">
                          <span className="stat-label">Number of Stops:</span>
                          <span className="stat-value">{routeInfo.stops} locations</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="route-order">
                  <h4>Route Order:</h4>
                  <p>Drag markers to reorder the route sequence</p>
                  {markers.length > 0 && (
                    <div className="route-sequence">
                      {[...markers]
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((marker, index) => (
                          <div key={marker.id} className="route-step">
                            <span className="step-number">{index + 1}</span>
                            <span className="step-name">{marker.title || `Point ${index + 1}`}</span>
                            <div className="step-actions">
                              {index > 0 && (
                                <button 
                                  className="move-up-btn"
                                  onClick={() => {
                                    const newOrder = markers.find(m => m.order === index).order;
                                    updateMarker(marker.id, { order: newOrder });
                                    updateMarker(markers.find(m => m.order === index).id, { order: marker.order });
                                  }}
                                  title="Move up"
                                >
                                  ⬆️
                                </button>
                              )}
                              {index < markers.length - 1 && (
                                <button 
                                  className="move-down-btn"
                                  onClick={() => {
                                    const nextMarker = markers.find(m => m.order === index + 2);
                                    if (nextMarker) {
                                      updateMarker(marker.id, { order: nextMarker.order });
                                      updateMarker(nextMarker.id, { order: marker.order });
                                    }
                                  }}
                                  title="Move down"
                                >
                                  ⬇️
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="route-tips">
                  <h4>💡 Route Tips:</h4>
                  <ul>
                    <li>The route will connect your markers in the order specified</li>
                    <li>Use the up/down arrows to change the route sequence</li>
                    <li>The route uses walking directions for the best experience</li>
                    <li>Preview your route before saving to see the path</li>
                  </ul>
                </div>
              </div>
            )}

            {sidebarTab === 'settings' && (
              <div className="settings-panel">
                <h3>Map Settings</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Map Name:</label>
                    <input
                      type="text"
                      value={mapSettings.title}
                      onChange={(e) => setMapSettings({...mapSettings, title: e.target.value})}
                      placeholder="Enter map name..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Map Description:</label>
                    <textarea
                      value={mapSettings.description}
                      onChange={(e) => setMapSettings({...mapSettings, description: e.target.value})}
                      placeholder="Enter map description..."
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Visibility:</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          checked={mapSettings.isPublic}
                          onChange={() => setMapSettings({...mapSettings, isPublic: true})}
                        />
                        🌍 Public (everyone can view)
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          checked={!mapSettings.isPublic}
                          onChange={() => setMapSettings({...mapSettings, isPublic: false})}
                        />
                        🔒 Private (only you can view)
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Map Theme:</label>
                    <select
                      value={mapSettings.theme}
                      onChange={(e) => {
                        setMapSettings({...mapSettings, theme: e.target.value});
                        if (map) {
                          map.setOptions({ styles: getMapTheme(e.target.value) });
                        }
                      }}
                    >
                      <option value="default">Default</option>
                      <option value="dark">Dark</option>
                      <option value="retro">Retro</option>
                      <option value="silver">Silver</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={mapSettings.walkthrough}
                        onChange={(e) => setMapSettings({...mapSettings, walkthrough: e.target.checked})}
                      />
                      🚶 Enable Walkthrough (automatically guide through points)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Map Container */}
        <div className="map-editor-map-container">
          <div ref={mapRef} className="map-editor-map"></div>
          {isAddingMarker && (
            <div className="map-instruction">
              <p>📍 Click on the map to add a new marker</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapEditor; 