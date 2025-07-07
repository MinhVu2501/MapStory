// mapstory/src/pages/Home.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import MapCreationForm from './MapCreationForm'; // <--- IMPORT THE MAP CREATION FORM

const Home = () => {
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // State to control visibility of the MapCreationForm
  const [showCreateMapForm, setShowCreateMapForm] = useState(false); // <--- NEW STATE

  // Store active markers and drawing tools
  const [activeMarkers, setActiveMarkers] = useState([]);
  const [drawingManager, setDrawingManager] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentMapType, setCurrentMapType] = useState('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState(null);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurementPath, setMeasurementPath] = useState([]);
  const [measurementPolyline, setMeasurementPolyline] = useState(null);
  const [drawnShapes, setDrawnShapes] = useState([]);

  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true);
        const apiKey = import.meta.env.VITE_Maps_API_KEY;
        console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
        console.log('API Key value:', apiKey);

        if (!apiKey || apiKey === 'YOUR_Maps_API_KEY') {
          throw new Error('Google Maps API key is not configured. Please add VITE_Maps_API_KEY to your .env file.');
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geocoding', 'drawing', 'geometry'],
          region: 'US',
          language: 'en'
        });

        const google = await loader.load();

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 21.0285, lng: 105.8542 }, // Hanoi, Vietnam
          zoom: 10,
          mapTypeControl: false, // We'll add custom controls
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          mapId: null
        });

        setMap(mapInstance);

        // Initialize Drawing Manager
        const drawingManagerInstance = new google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false, // We'll add custom controls
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              google.maps.drawing.OverlayType.MARKER,
              google.maps.drawing.OverlayType.CIRCLE,
              google.maps.drawing.OverlayType.POLYGON,
              google.maps.drawing.OverlayType.POLYLINE,
              google.maps.drawing.OverlayType.RECTANGLE
            ]
          },
          markerOptions: {
            icon: {
              url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjRkY2QjM1Ii8+Cjwvc3ZnPgo=',
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32)
            },
            draggable: true
          },
          circleOptions: {
            fillColor: '#667eea',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#667eea',
            clickable: false,
            editable: true,
            zIndex: 1
          },
          polygonOptions: {
            fillColor: '#667eea',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#667eea',
            clickable: false,
            editable: true,
            zIndex: 1
          },
          polylineOptions: {
            strokeColor: '#667eea',
            strokeWeight: 3,
            clickable: false,
            editable: true,
            zIndex: 1
          },
          rectangleOptions: {
            fillColor: '#667eea',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#667eea',
            clickable: false,
            editable: true,
            zIndex: 1
          }
        });

        drawingManagerInstance.setMap(mapInstance);
        setDrawingManager(drawingManagerInstance);

        // Listen for drawing completion
        google.maps.event.addListener(drawingManagerInstance, 'overlaycomplete', (event) => {
          const newShape = event.overlay;
          setDrawnShapes(prev => [...prev, newShape]);
          
          // Add delete functionality to shapes
          if (event.type !== google.maps.drawing.OverlayType.MARKER) {
            newShape.addListener('rightclick', () => {
              newShape.setMap(null);
              setDrawnShapes(prev => prev.filter(shape => shape !== newShape));
            });
          }
        });

        // Initialize Traffic Layer
        const trafficLayerInstance = new google.maps.TrafficLayer();
        setTrafficLayer(trafficLayerInstance);

        // Add measurement click listener
        mapInstance.addListener('click', (event) => {
          if (measurementMode) {
            addMeasurementPoint(event.latLng, mapInstance, google);
          }
        });

        // Setup Places Autocomplete
        const inputElement = searchInputRef.current;
        if (inputElement) {
          const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            types: ['geocode', 'establishment'],
            fields: ['place_id', 'geometry', 'name', 'formatted_address', 'rating', 'types'],
            componentRestrictions: { country: [] }
          });

          autocomplete.bindTo('bounds', mapInstance);

          autocomplete.addListener('place_changed', () => {
            handlePlaceSelect(autocomplete, mapInstance, google);
          });
        }

        // Get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setUserLocation(userPos);
            },
            () => {
              console.log('Geolocation service failed.');
            }
          );
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError(err.message || 'Failed to load Google Maps. Please check your API key and network connection.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      activeMarkers.forEach(marker => marker.setMap(null));
      drawnShapes.forEach(shape => shape.setMap(null));
    };
  }, []);

  const handlePlaceSelect = (autocomplete, mapInstance, google) => {
    activeMarkers.forEach(marker => marker.setMap(null));
    setActiveMarkers([]);

    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      console.error("Returned place contains no geometry or location for: ", place.name);
      window.alert("No details available for input: '" + place.name + "'");
      setSearchResults([]);
      setSelectedLocation(null);
      return;
    }

    if (place.geometry.viewport) {
      mapInstance.fitBounds(place.geometry.viewport);
    } else {
      mapInstance.setCenter(place.geometry.location);
      mapInstance.setZoom(17);
    }

    const marker = new google.maps.Marker({
      map: mapInstance,
      title: place.name,
      position: place.geometry.location,
      animation: google.maps.Animation.DROP,
      icon: {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjMDA3Q0ZGIi8+Cjwvc3ZnPgo=',
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32)
      }
    });

    setActiveMarkers([marker]);

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 300px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${place.name}</h3>
          <p style="margin: 5px 0; color: #666;">${place.formatted_address || ''}</p>
          ${place.rating ? `<p style="margin: 5px 0; color: #ff6b35;">Rating: ${place.rating} ⭐</p>` : ''}
          ${place.types && place.types.length > 0 ? `<p style="margin: 5px 0; color: #888; font-size: 12px;">Type: ${place.types[0].replace(/_/g, ' ')}</p>` : ''}
          <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}', '_blank')" style="background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px;">View on Google Maps</button>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstance, marker);
    });

    const newResult = {
      name: place.name,
      address: place.formatted_address,
      location: place.geometry.location,
      rating: place.rating,
      types: place.types,
      place_id: place.place_id,
      marker: marker,
      infoWindow: infoWindow
    };
    setSearchResults([newResult]);
    setSelectedLocation(newResult);
  };

  const addMeasurementPoint = (latLng, mapInstance, google) => {
    const newPath = [...measurementPath, latLng];
    setMeasurementPath(newPath);

    if (measurementPolyline) {
      measurementPolyline.setMap(null);
    }

    if (newPath.length > 1) {
      const polyline = new google.maps.Polyline({
        path: newPath,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: mapInstance
      });

      setMeasurementPolyline(polyline);

      // Calculate distance
      let totalDistance = 0;
      for (let i = 0; i < newPath.length - 1; i++) {
        totalDistance += google.maps.geometry.spherical.computeDistanceBetween(
          newPath[i],
          newPath[i + 1]
        );
      }

      const distanceInKm = (totalDistance / 1000).toFixed(2);
      console.log(`Total distance: ${distanceInKm} km`);
      
      // You could show this in a UI element
      setError(`Distance: ${distanceInKm} km`);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() && map) {
      setLoading(true);
      setError(null);
      activeMarkers.forEach(marker => marker.setMap(null));
      setActiveMarkers([]);

      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const place = results[0];
            if (!place.geometry || !place.geometry.location) {
              setError("No details available for search query: '" + searchQuery + "'");
              setLoading(false);
              return;
            }

            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(17);
            }

            const marker = new window.google.maps.Marker({
              map: map,
              title: place.formatted_address,
              position: place.geometry.location,
              animation: window.google.maps.Animation.DROP
            });
            setActiveMarkers([marker]);

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; max-width: 300px;">
                  <h3 style="margin: 0 0 10px 0; color: #333;">${place.formatted_address}</h3>
                  ${place.place_id ? `<p style="margin: 5px 0; color: #888; font-size: 12px;">Place ID: ${place.place_id}</p>` : ''}
                  <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.formatted_address)}&query_place_id=${place.place_id || ''}', '_blank')" style="background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px;">View on Google Maps</button>
                </div>
              `
            });
            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            const newResult = {
              name: place.formatted_address,
              address: place.formatted_address,
              location: place.geometry.location,
              place_id: place.place_id,
              marker: marker,
              infoWindow: infoWindow
            };
            setSearchResults([newResult]);
            setSelectedLocation(newResult);

          } else {
            setError(`Geocoding failed for "${searchQuery}" with status: ${status}`);
            setSearchResults([]);
            setSelectedLocation(null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Failed to search for location. Please try again.');
        setLoading(false);
      }
    }
  };

  const clearSearch = () => {
    activeMarkers.forEach(marker => marker.setMap(null));
    setActiveMarkers([]);

    setSearchQuery('');
    setSearchResults([]);
    setSelectedLocation(null);
    if (map) {
      map.setCenter({ lat: 21.0285, lng: 105.8542 });
      map.setZoom(10);
    }
  };

  const handleMapCreationSuccess = () => {
    setShowCreateMapForm(false); // Close the form
    // Optional: Add a success message or redirect the user
    // navigate('/my-maps'); // If you want to go to My Maps after creation
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to MapStory Creator!</h1>
        <p>Your platform for creating and sharing interactive map stories.</p>

        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a city, place, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              Search
            </button>
            {searchResults.length > 0 && (
              <button type="button" onClick={clearSearch} className="clear-btn">
                Clear
              </button>
            )}
          </form>

          <div className="popular-searches">
            <p>Popular searches:</p>
            <div className="search-tags">
              {['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Dubai', 'Singapore', 'Bangkok'].map(city => (
                <button
                  key={city}
                  className="search-tag"
                  onClick={() => {
                    setSearchQuery(city);
                    handleSearch({ preventDefault: () => {} });
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="map-container">
        {loading && <div className="loading">Loading map...</div>}
        {error && <div className="error">{error}</div>}
        <div ref={mapRef} className="google-map"></div>
      </div>

      {/* Conditionally render MapCreationForm as an overlay or within the section */}
      {showCreateMapForm && (
        <div className="create-map-overlay"> {/* Add styling for overlay */}
          <MapCreationForm
            mapInstance={map} // Pass the map instance to the form
            onSuccess={handleMapCreationSuccess} // Callback on success
            onCancel={() => setShowCreateMapForm(false)} // Callback to close form on cancel
          />
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({searchResults.length})</h3>
          <div className="results-grid">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={`result-card ${selectedLocation === result ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedLocation(result);
                  if (map && result.location) {
                    map.setCenter(result.location);
                    map.setZoom(16);
                    if (result.infoWindow && result.marker) {
                      result.infoWindow.open(map, result.marker);
                    }
                  }
                }}
              >
                <div className="result-header">
                  <h4>{result.name}</h4>
                  {result.rating && <span className="rating">⭐ {result.rating}</span>}
                </div>
                <p className="address">{result.address}</p>
                {result.types && result.types[0] && (
                  <span className="place-type">{result.types[0].replace(/_/g, ' ')}</span>
                )}
                <button
                  className="view-on-maps-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.name)}&query_place_id=${result.place_id || ''}`, '_blank');
                  }}
                >
                  View on Google Maps
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="features-section">
        <h2>Start Creating Your Map Stories</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📍 Explore Locations</h3>
            <p>Search and discover interesting places around the world</p>
          </div>
          <div className="feature-card">
            <h3>🗺️ Create Maps</h3>
            <p>Build interactive maps with your own stories and markers.</p>
            {/* Button to show the MapCreationForm */}
            <button onClick={() => setShowCreateMapForm(true)} className="action-button">
              Start Creating
            </button>
          </div>
          <div className="feature-card">
            <h3>📖 Share Stories</h3>
            <p>Share your travel experiences and local knowledge</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;