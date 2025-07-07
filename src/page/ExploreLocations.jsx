import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

const ExploreLocations = () => {
  const [map, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5000); // 5km default
  const [placeType, setPlaceType] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [bookmarkedPlaces, setBookmarkedPlaces] = useState([]);
  
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Place types for filtering
  const placeTypes = [
    { value: '', label: 'All Places' },
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'tourist_attraction', label: 'Attractions' },
    { value: 'lodging', label: 'Hotels' },
    { value: 'shopping_mall', label: 'Shopping' },
    { value: 'museum', label: 'Museums' },
    { value: 'park', label: 'Parks' },
    { value: 'hospital', label: 'Healthcare' },
    { value: 'gas_station', label: 'Gas Stations' },
    { value: 'bank', label: 'Banks' },
    { value: 'pharmacy', label: 'Pharmacies' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest' },
    { value: 'name', label: 'Alphabetical' },
    { value: 'user_ratings_total', label: 'Most Reviewed' }
  ];

  useEffect(() => {
    initializeMap();
    getUserLocation();
  }, []);

  const initializeMap = async () => {
    try {
      if (!mapRef.current) {
        console.error('Map container element not found');
        return;
      }

      const google = await loadGoogleMaps();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 21.0285, lng: 105.8542 }, // Hanoi, Vietnam
        zoom: 13,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#667eea' }]
          }
        ]
      });

      setMap(mapInstance);

      // Setup Places Autocomplete
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          types: ['geocode'],
          fields: ['place_id', 'geometry', 'name', 'formatted_address']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            mapInstance.setCenter(place.geometry.location);
            mapInstance.setZoom(14);
            searchNearbyPlaces(place.geometry.location, google);
          }
        });
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          if (map) {
            map.setCenter(userPos);
            searchNearbyPlaces(userPos, window.google);
          }
        },
        (error) => {
          console.log('Geolocation failed:', error);
        }
      );
    }
  };

  const searchNearbyPlaces = async (location, google) => {
    if (!map || !google) return;

    setLoading(true);
    const service = new google.maps.places.PlacesService(map);

    const request = {
      location: location,
      radius: searchRadius,
      type: placeType || undefined,
      keyword: searchQuery || undefined
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const processedResults = results.map(place => ({
          ...place,
          distance: userLocation ? 
            google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(userLocation.lat, userLocation.lng),
              place.geometry.location
            ) : 0
        }));

        // Sort results
        const sortedResults = sortLocations(processedResults);
        setLocations(sortedResults);
        
        // Clear existing markers and add new ones
        clearMapMarkers();
        addMapMarkers(sortedResults, google);
      } else {
        console.error('Places search failed:', status);
        setLocations([]);
      }
      setLoading(false);
    });
  };

  const sortLocations = (locations) => {
    return [...locations].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          return a.distance - b.distance;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'user_ratings_total':
          return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
        default:
          return 0;
      }
    });
  };

  const clearMapMarkers = () => {
    // This would clear existing markers if we were storing them
  };

  const addMapMarkers = (locations, google) => {
    locations.forEach(location => {
      const marker = new google.maps.Marker({
        position: location.geometry.location,
        map: map,
        title: location.name,
        icon: {
          url: `data:image/svg+xml;base64,${btoa(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#667eea"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(30, 30),
          anchor: new google.maps.Point(15, 30)
        }
      });

      marker.addListener('click', () => {
        setSelectedLocation(location);
        getPlaceDetails(location.place_id, google);
      });
    });
  };

  const getPlaceDetails = (placeId, google) => {
    const service = new google.maps.places.PlacesService(map);
    
    service.getDetails({
      placeId: placeId,
      fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'user_ratings_total', 'photos', 'opening_hours', 'price_level', 'reviews']
    }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        setSelectedLocation(prev => ({ ...prev, details: place }));
      }
    });
  };

  const handleSearch = () => {
    if (map && userLocation) {
      searchNearbyPlaces(userLocation, window.google);
    }
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    if (map) {
      map.setCenter(location.geometry.location);
      map.setZoom(16);
    }
    getPlaceDetails(location.place_id, window.google);
  };

  const toggleBookmark = (placeId) => {
    setBookmarkedPlaces(prev => 
      prev.includes(placeId) 
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <div className="explore-locations-page">
      <div className="explore-header">
        <h1>🗺️ Explore Locations</h1>
        <p>Discover amazing places around you</p>
      </div>

      <div className="search-controls">
        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="location-search-input"
          />
          <button onClick={handleSearch} className="search-btn" disabled={loading}>
            {loading ? '🔄' : '🔍'} Search
          </button>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={placeType} 
              onChange={(e) => setPlaceType(e.target.value)}
              className="filter-select"
            >
              {placeTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Radius:</label>
            <select 
              value={searchRadius} 
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="filter-select"
            >
              <option value={1000}>1 km</option>
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={25000}>25 km</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              📋 Grid
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              🗺️ Map
            </button>
          </div>
        </div>
      </div>

      <div className="explore-content">
        {viewMode === 'map' ? (
          <div className="map-view">
            <div ref={mapRef} className="explore-map"></div>
          </div>
        ) : (
          <div className="locations-grid">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Searching for locations...</p>
              </div>
            ) : locations.length > 0 ? (
              locations.map((location) => (
                <div 
                  key={location.place_id} 
                  className="location-card"
                  onClick={() => handleLocationClick(location)}
                >
                  <div className="location-image">
                    {location.photos && location.photos[0] ? (
                      <img 
                        src={location.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 })}
                        alt={location.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="location-placeholder" style={{ display: location.photos ? 'none' : 'flex' }}>
                      <span className="location-icon">📍</span>
                    </div>
                    <button 
                      className={`bookmark-btn ${bookmarkedPlaces.includes(location.place_id) ? 'bookmarked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(location.place_id);
                      }}
                    >
                      {bookmarkedPlaces.includes(location.place_id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  
                  <div className="location-info">
                    <h3>{location.name}</h3>
                    <p className="location-address">{location.vicinity}</p>
                    
                    <div className="location-meta">
                      {location.rating && (
                        <div className="rating">
                          <span className="stars">⭐</span>
                          <span>{location.rating.toFixed(1)}</span>
                          {location.user_ratings_total && (
                            <span className="review-count">({location.user_ratings_total})</span>
                          )}
                        </div>
                      )}
                      
                      {location.distance > 0 && (
                        <div className="distance">
                          📍 {formatDistance(location.distance)}
                        </div>
                      )}
                      
                      {location.price_level && (
                        <div className="price-level">
                          {'💰'.repeat(location.price_level)}
                        </div>
                      )}
                    </div>
                    
                    <div className="location-types">
                      {location.types && location.types.slice(0, 2).map(type => (
                        <span key={type} className="type-tag">
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No locations found. Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Details Modal */}
      {selectedLocation && selectedLocation.details && (
        <div className="location-modal-overlay" onClick={() => setSelectedLocation(null)}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedLocation.name}</h2>
              <button 
                className="close-modal"
                onClick={() => setSelectedLocation(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {selectedLocation.details.photos && (
                <div className="location-photos">
                  <img 
                    src={selectedLocation.details.photos[0].getUrl({ maxWidth: 500, maxHeight: 300 })}
                    alt={selectedLocation.name}
                  />
                </div>
              )}
              
              <div className="location-details">
                <div className="detail-section">
                  <h4>📍 Address</h4>
                  <p>{selectedLocation.details.formatted_address}</p>
                </div>
                
                {selectedLocation.details.formatted_phone_number && (
                  <div className="detail-section">
                    <h4>📞 Phone</h4>
                    <p>{selectedLocation.details.formatted_phone_number}</p>
                  </div>
                )}
                
                {selectedLocation.details.website && (
                  <div className="detail-section">
                    <h4>🌐 Website</h4>
                    <a href={selectedLocation.details.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  </div>
                )}
                
                {selectedLocation.details.opening_hours && (
                  <div className="detail-section">
                    <h4>🕒 Hours</h4>
                    <div className="opening-hours">
                      {selectedLocation.details.opening_hours.weekday_text.map((day, index) => (
                        <p key={index}>{day}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedLocation.details.reviews && selectedLocation.details.reviews.length > 0 && (
                  <div className="detail-section">
                    <h4>💬 Recent Reviews</h4>
                    <div className="reviews">
                      {selectedLocation.details.reviews.slice(0, 3).map((review, index) => (
                        <div key={index} className="review">
                          <div className="review-header">
                            <span className="reviewer">{review.author_name}</span>
                            <span className="review-rating">⭐ {review.rating}</span>
                          </div>
                          <p className="review-text">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreLocations; 