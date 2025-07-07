import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader';

const MapView = () => {
  const { id } = useParams();
  const [map, setMap] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchMapData();
  }, [id]);

  useEffect(() => {
    if (mapData) {
      initializeMap();
    }
  }, [mapData]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/maps/${id}`);
      
      if (!response.ok) {
        throw new Error('Map not found');
      }
      
      const data = await response.json();
      setMapData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
      console.log('API Key value:', apiKey);
      
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
        throw new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
      }

      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places', 'drawing', 'geometry', 'routes'],
        region: 'US',
        language: 'en'
      });

      const google = await loader.load();
      
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
            title: marker.title,
            icon: {
              url: marker.image_url ? `http://localhost:3001${marker.image_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjRkY2QjM1Ii8+Cjwvc3ZnPgo=',
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40)
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 15px; max-width: 300px;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${marker.title}</h3>
                <p style="margin: 8px 0; color: #666; line-height: 1.4;">${marker.description}</p>
                ${marker.image_url ? `
                  <img src="http://localhost:3001${marker.image_url}" 
                       alt="${marker.title}" 
                       style="width: 100%; max-width: 250px; height: auto; border-radius: 8px; margin-top: 10px;" />
                ` : ''}
              </div>
            `
          });

          markerInstance.addListener('click', () => {
            infoWindow.open(mapInstance, markerInstance);
          });
        });
      }

    } catch (err) {
      console.error('Error loading Google Maps:', err);
      setError('Failed to load map. Please try again.');
    }
  };

  const createFoodTourRoute = async () => {
    if (!map || !directionsRenderer || !mapData.markers || mapData.markers.length < 2) {
      return;
    }

    const google = window.google;
    const directionsService = new google.maps.DirectionsService();

    // Define the optimal order for a food tour (starting from a central location)
    const tourOrder = [
      'Ben Thanh Market',
      'Nguyen Hue Walking Street', 
      'Pho 24',
      'Banh Mi Huynh Hoa',
      'Bui Vien Street',
      'Secret Garden',
      'Skydeck Bar'
    ];

    // Sort markers according to tour order
    const sortedMarkers = tourOrder.map(name => 
      mapData.markers.find(marker => 
        marker.name.toLowerCase().includes(name.toLowerCase()) ||
        marker.title?.toLowerCase().includes(name.toLowerCase())
      )
    ).filter(Boolean);

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
        const fromLocation = legIndex === 0 ? sortedMarkers[0].title : sortedMarkers[legIndex].title;
        const toLocation = sortedMarkers[legIndex + 1].title;
        
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
          name: marker.title,
          description: marker.description
        }))
      };
      
      setRouteInfo(routeData);
      console.log(`Food tour route created: ${routeData.totalDistance}km, ${routeData.totalDuration} minutes walking`);
      
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
      createFoodTourRoute();
      setShowRoute(true);
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
        </div>
        <div className="map-view-actions">
          <button 
            className={`route-btn ${showRoute ? 'active' : ''}`}
            onClick={toggleRoute}
          >
            {showRoute ? '🗺️ Hide Route' : '🚶 Show Food Tour Route'}
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
          <div className="route-info-panel">
            <div className="route-summary">
              <h3>🚶 Food Tour Route</h3>
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
            </div>
            
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
                    src={`http://localhost:3001${marker.image_url}`} 
                    alt={marker.title}
                    className="marker-image"
                  />
                )}
                <div className="marker-info">
                  <h4>{marker.title}</h4>
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