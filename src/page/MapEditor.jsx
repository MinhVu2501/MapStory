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
  const [sidebarTab, setSidebarTab] = useState('markers'); // 'markers' or 'settings'
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
      alert('Vui lòng nhập tên bản đồ');
      return;
    }

    setSaving(true);
    try {
      const mapData = {
        title: mapSettings.title,
        description: mapSettings.description,
        isPublic: mapSettings.isPublic,
        theme: mapSettings.theme,
        walkthrough: mapSettings.walkthrough,
        markers: markers.map(marker => ({
          id: marker.id,
          position: marker.position,
          title: marker.title,
          description: marker.description,
          imageUrl: marker.imageUrl,
          link: marker.link,
          icon: marker.icon,
          color: marker.color,
          order: marker.order
        }))
      };

      const response = await fetch(buildApiUrl('/api/maps'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Bản đồ đã được lưu thành công!');
        console.log('Map saved:', result);
      } else {
        throw new Error('Failed to save map');
      }
    } catch (error) {
      console.error('Error saving map:', error);
      alert('Có lỗi xảy ra khi lưu bản đồ');
    } finally {
      setSaving(false);
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