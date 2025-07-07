// mapstory/src/pages/Home.jsx

import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import { buildApiUrl, API_BASE_URL } from '../config/api';
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

  // Share Stories state
  const [publicStories, setPublicStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Landing page state
  const [showLandingPage, setShowLandingPage] = useState(true);
  
  // Like functionality
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    // Only initialize map when not showing landing page
    if (!showLandingPage) {
      const initMap = async () => {
        try {
          setLoading(true);
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
          console.log('API Key value:', apiKey);

          if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
            throw new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
          }

          if (!mapRef.current) {
            console.error('Map container element not found');
            setError('Map container not available');
            setLoading(false);
            return;
          }

          const google = await loadGoogleMaps();

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
    }
  }, [showLandingPage]);

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

  // Fetch public stories
  const fetchPublicStories = async () => {
    try {
      setStoriesLoading(true);
      const response = await fetch(buildApiUrl('/api/maps/public-stories?limit=8'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch public stories');
      }
      
      const data = await response.json();
      setPublicStories(data);
    } catch (err) {
      console.error('Error fetching public stories:', err);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Load public stories on component mount
  useEffect(() => {
    fetchPublicStories();
  }, []);

  // Handle story selection
  const handleStoryClick = (story) => {
    setSelectedStory(story);
    setShowStoryModal(true);
  };

  // Close story modal
  const closeStoryModal = () => {
    setShowStoryModal(false);
    setSelectedStory(null);
  };

  const handleGetStarted = () => {
    setShowLandingPage(false);
    setShowCreateMapForm(true);
  };

  const handleExploreMap = () => {
    setShowLandingPage(false);
  };

  const handleLikeStory = async (storyId) => {
    if (isLiking) return;
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to like maps!');
      return;
    }
    
    setIsLiking(true);
    try {
      const response = await fetch(buildApiUrl(`/api/maps/${storyId}/like`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to like story');
      }
      
      const data = await response.json();
      
      // Update the selected story in modal
      if (selectedStory && selectedStory.id === storyId) {
        setSelectedStory({ ...selectedStory, likes: data.likes });
      }
      
      // Update the story in the stories list
      setPublicStories(prevStories => 
        prevStories.map(story => 
          story.id === storyId ? { ...story, likes: data.likes } : story
        )
      );
      
    } catch (err) {
      console.error('Error liking story:', err);
      alert(err.message || 'Failed to like story');
    } finally {
      setIsLiking(false);
    }
  };

  if (showLandingPage) {
    return (
      <div className="landing-page">


        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">Tell Your Story on the Map</h1>
              <p className="hero-subtitle">
                Easily create travel maps, journey diaries, and virtual tours with images, videos, and personal stories.
              </p>
              <button className="hero-cta" onClick={handleGetStarted}>
                Create Your First Map (Free)
              </button>

            </div>
            <div className="hero-visual">
              <div className="floating-map">
                <div className="map-preview">
                  <div className="map-markers">
                    <div className="marker marker-1">📍</div>
                    <div className="marker marker-2">📍</div>
                    <div className="marker marker-3">📍</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="features" className="how-it-works">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps-grid">
              <div className="step">
                <div className="step-icon">📍</div>
                <h3>Mark Locations</h3>
                <p>Select any point on the map and add it to your story</p>
              </div>
              <div className="step">
                <div className="step-icon">📝</div>
                <h3>Add Stories</h3>
                <p>Attach photos, videos, and text to each point to create vivid stories</p>
              </div>
              <div className="step">
                <div className="step-icon">🎨</div>
                <h3>Customize & Arrange</h3>
                <p>Drag and drop points, choose icons, arrange story sequence as you like</p>
              </div>
              <div className="step">
                <div className="step-icon">🚀</div>
                <h3>Share & Explore</h3>
                <p>Share links or embed your map with friends and the community</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Map Stories */}
        <section id="community" className="featured-stories">
          <div className="container">
            <h2>Map Story Examples</h2>
            <p>Explore amazing stories created by the community</p>
            
            {storiesLoading ? (
              <div className="stories-loading">
                <div className="loading-spinner"></div>
                <p>Loading stories...</p>
              </div>
            ) : (
              <div className="stories-grid">
                {publicStories.map((story) => (
                  <div key={story.id} className="story-card" onClick={() => handleStoryClick(story)}>
                    <div className="story-thumbnail">
                      {story.thumbnail_url ? (
                        <img src={story.thumbnail_url} alt={story.title} />
                      ) : (
                        <div className="story-placeholder">
                          <div className="story-icon">🗺️</div>
                        </div>
                      )}
                    </div>
                    <div className="story-content">
                      <h3>{story.title}</h3>
                      <p className="story-description">{story.description}</p>
                      <div className="story-meta">
                        <span className="story-author">by {story.author_name || 'Anonymous'}</span>
                        <span className="story-date">{new Date(story.created_at).toLocaleDateString('en-US')}</span>
                      </div>
                      <div className="story-stats">
                        <span className="stat-item">
                          <span className="stat-icon">👁️</span>
                          <span className="stat-value">{story.views || 0}</span>
                        </span>
                        <span className="stat-item">
                          <span className="stat-icon">❤️</span>
                          <span className="stat-value">{story.likes || 0}</span>
                        </span>
                      </div>
                    </div>
                    <div className="story-actions">
                      <button className="story-view-btn">View Map</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {publicStories.length === 0 && !storiesLoading && (
              <div className="no-stories">
                <p>No stories shared yet. Be the first!</p>
              </div>
            )}
          </div>
        </section>

        {/* Why Choose MapStory Creator */}
        <section className="why-choose-us">
          <div className="container">
            <h2>Why Choose MapStory Creator?</h2>
            <div className="benefits-grid">
              <div className="benefit">
                <div className="benefit-icon">🎯</div>
                <h3>Intuitive & Easy to Use</h3>
                <p>Simple drag-and-drop interface, no technical skills required</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🎭</div>
                <h3>Rich Multimedia Support</h3>
                <p>Support for images, videos, text, and many other formats</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🚶</div>
                <h3>Walkthrough Feature</h3>
                <p>Automatically guide viewers through your story</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🎨</div>
                <h3>Unlimited Customization</h3>
                <p>Icons, colors, layout according to your personal style</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🌍</div>
                <h3>Community & Sharing</h3>
                <p>Easily search and share maps with the community</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">📱</div>
                <h3>Responsive on All Devices</h3>
                <p>Works smoothly on desktop, tablet, and mobile</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="pricing-section">
          <div className="container">
            <h2>Choose Your Perfect Plan</h2>
            <div className="pricing-grid">
              <div className="pricing-card">
                <h3>Free</h3>
                <div className="price">$0<span>/month</span></div>
                <ul className="features-list">
                  <li>✅ Create up to 3 maps</li>
                  <li>✅ 100MB storage</li>
                  <li>✅ Basic features</li>
                  <li>✅ Public sharing</li>
                  <li>❌ No watermark</li>
                </ul>
                <button className="pricing-btn" onClick={handleGetStarted}>Start Free</button>
              </div>
              <div className="pricing-card featured">
                <div className="popular-badge">Popular</div>
                <h3>Pro</h3>
                <div className="price">$9<span>/month</span></div>
                <ul className="features-list">
                  <li>✅ Unlimited maps</li>
                  <li>✅ 10GB storage</li>
                  <li>✅ All features</li>
                  <li>✅ No watermark</li>
                  <li>✅ Custom domain</li>
                  <li>✅ Detailed analytics</li>
                </ul>
                <button className="pricing-btn">Upgrade to Pro</button>
              </div>
              <div className="pricing-card">
                <h3>Team</h3>
                <div className="price">$29<span>/month</span></div>
                <ul className="features-list">
                  <li>✅ All Pro features</li>
                  <li>✅ 100GB storage</li>
                  <li>✅ Team collaboration</li>
                  <li>✅ Member management</li>
                  <li>✅ Priority support</li>
                  <li>✅ API integration</li>
                </ul>
                <button className="pricing-btn">Contact Us</button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <div className="container">
            <h2>Ready to Create Your Story?</h2>
            <p>Join thousands who trust MapStory Creator</p>
            <button className="cta-button" onClick={handleGetStarted}>
              Get Started - Free
            </button>
            <button className="cta-button secondary" onClick={handleExploreMap}>
              Explore Sample Maps
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>MapStory Creator</h3>
                <p>Leading interactive map storytelling platform</p>
                <div className="social-links">
                  <a href="#" aria-label="Facebook">📘</a>
                  <a href="#" aria-label="Twitter">🐦</a>
                  <a href="#" aria-label="Instagram">📷</a>
                  <a href="#" aria-label="YouTube">📺</a>
                </div>
              </div>
              <div className="footer-section">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#community">Community</a></li>
                  <li><a href="#blog">Blog</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Support</h4>
                <ul>
                  <li><a href="#help">Help Center</a></li>
                  <li><a href="#contact">Contact</a></li>
                  <li><a href="#tutorials">Tutorials</a></li>
                  <li><a href="#api">API</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#terms">Terms of Service</a></li>
                  <li><a href="#privacy">Privacy Policy</a></li>
                  <li><a href="#cookies">Cookie Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2024 MapStory Creator. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Story Modal */}
        {showStoryModal && selectedStory && (
          <div className="story-modal-overlay" onClick={closeStoryModal}>
            <div className="story-modal" onClick={(e) => e.stopPropagation()}>
              <div className="story-modal-header">
                <h2>{selectedStory.title}</h2>
                <button className="story-modal-close" onClick={closeStoryModal}>×</button>
              </div>
              <div className="story-modal-content">
                <p className="story-modal-description">{selectedStory.description}</p>
                <div className="story-modal-meta">
                  <span className="story-modal-author">Author: {selectedStory.author_name || 'Anonymous'}</span>
                  <span className="story-modal-date">Created: {new Date(selectedStory.created_at).toLocaleDateString('en-US')}</span>
                </div>
                <div className="story-modal-actions">
                                      <a href={`/map/${selectedStory.id}`} className="story-modal-view-btn">
                      View Full Map
                    </a>
                                    <button 
                  className="story-modal-like-btn"
                  onClick={() => handleLikeStory(selectedStory.id)}
                  disabled={isLiking}
                >
                  {isLiking ? '⏳ Liking...' : '❤️ Like'}
                </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Explore the World Through Maps</h1>
        <p>Search for locations, create personal maps, and share your stories</p>
      </div>

      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search for places, restaurants, hotels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? '🔄' : '🔍'}
          </button>
          {searchQuery && (
            <button type="button" className="clear-btn" onClick={clearSearch}>
              ✕
            </button>
          )}
        </form>
        
        <div className="popular-searches">
          <p>Popular searches:</p>
          <div className="search-tags">
            <span className="search-tag" onClick={() => setSearchQuery('restaurants New York')}>Restaurants NYC</span>
            <span className="search-tag" onClick={() => setSearchQuery('hotels Paris')}>Hotels Paris</span>
            <span className="search-tag" onClick={() => setSearchQuery('tourist attractions London')}>London Attractions</span>
            <span className="search-tag" onClick={() => setSearchQuery('coffee shops Tokyo')}>Tokyo Coffee</span>
          </div>
        </div>
      </div>

      <div className="map-container">
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading map...</p>
          </div>
        )}
        
        {error && (
          <div className="error">
            <h3>Map Loading Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        )}
        
        <div ref={mapRef} className="google-map"></div>
      </div>

      {showCreateMapForm && (
        <div className="create-map-overlay">
          <MapCreationForm
            mapInstance={map}
            onSuccess={handleMapCreationSuccess}
            onCancel={() => setShowCreateMapForm(false)}
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
            <button 
              onClick={() => window.location.href = '/explore'} 
              className="action-button"
            >
              Start Exploring
            </button>
          </div>
          <div className="feature-card">
            <h3>🗺️ Create Maps</h3>
            <p>Build interactive maps with your own stories and markers.</p>
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

      <div className="share-stories-section">
        <h2>🌍 Discover Community Stories</h2>
        <p>Explore amazing map stories shared by our community</p>
        
        {storiesLoading ? (
          <div className="stories-loading">
            <div className="loading-spinner"></div>
            <p>Loading stories...</p>
          </div>
        ) : (
          <div className="stories-grid">
            {publicStories.length > 0 ? (
              publicStories.map((story) => (
                <div
                  key={story.id}
                  className="story-card"
                  onClick={() => handleStoryClick(story)}
                >
                  <div className="story-thumbnail">
                    {story.thumbnail_url ? (
                      <img src={story.thumbnail_url} alt={story.title} />
                    ) : (
                      <div className="story-placeholder">
                        <span className="story-icon">🗺️</span>
                      </div>
                    )}
                  </div>
                  <div className="story-content">
                    <h3>{story.title}</h3>
                    <p className="story-description">{story.description}</p>
                    <div className="story-meta">
                      <span className="story-author">By {story.author_name || 'Anonymous'}</span>
                      <span className="story-date">
                        {new Date(story.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="story-stats">
                      <span className="stat-item">
                        <span className="stat-icon">👁️</span>
                        <span className="stat-value">{story.views || 0}</span>
                      </span>
                      <span className="stat-item">
                        <span className="stat-icon">❤️</span>
                        <span className="stat-value">{story.likes || 0}</span>
                      </span>
                    </div>
                  </div>
                  <div className="story-actions">
                    <button className="story-view-btn">View Story</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-stories">
                <p>No public stories available yet. Be the first to share your story!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showStoryModal && selectedStory && (
        <div className="story-modal-overlay" onClick={closeStoryModal}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <div className="story-modal-header">
              <h2>{selectedStory.title}</h2>
              <button className="story-modal-close" onClick={closeStoryModal}>
                ×
              </button>
            </div>
            <div className="story-modal-content">
              <div className="story-modal-info">
                <p className="story-modal-description">{selectedStory.description}</p>
                <div className="story-modal-meta">
                  <span className="story-modal-author">
                    Created by {selectedStory.author_name || 'Anonymous'}
                  </span>
                  <span className="story-modal-date">
                    {new Date(selectedStory.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="story-modal-stats">
                  <span className="modal-stat-item">
                    <span className="stat-icon">👁️</span>
                    <span className="stat-value">{selectedStory.views || 0}</span>
                    <span className="stat-label">views</span>
                  </span>
                  <span className="modal-stat-item">
                    <span className="stat-icon">❤️</span>
                    <span className="stat-value">{selectedStory.likes || 0}</span>
                    <span className="stat-label">likes</span>
                  </span>
                </div>
              </div>
              <div className="story-modal-actions">
                <button 
                  className="story-modal-view-btn"
                  onClick={() => {
                    // Navigate to the map view
                    window.open(`/map/${selectedStory.id}`, '_blank');
                  }}
                >
                  View Full Map
                </button>
                <button 
                  className="story-modal-like-btn"
                  onClick={() => handleLikeStory(selectedStory.id)}
                  disabled={isLiking}
                >
                  ❤️ {isLiking ? 'Liking...' : 'Like'}
                </button>
                <button className="story-modal-share-btn">
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;