import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

const MapTest = () => {
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [testResults, setTestResults] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    // Get the API key from environment
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    setApiKey(key || 'Not configured');
    
    initializeTestMap();
  }, []);

  const addTestResult = (test, success, details = '') => {
    setTestResults(prev => [...prev, { test, success, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const initializeTestMap = async () => {
    try {
      addTestResult('API Key Check', !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY, import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'API key found' : 'API key missing');
      
      addTestResult('Google Maps Loader', true, 'Starting to load Google Maps API...');
      
      const google = await loadGoogleMaps();
      addTestResult('Google Maps API Load', true, 'Google Maps API loaded successfully');

      if (!mapRef.current) {
        addTestResult('Map Container', false, 'Map container element not found');
        setError('Map container not available');
        setLoading(false);
        return;
      }
      addTestResult('Map Container', true, 'Map container element found');

      // Create map instance
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 10.8231, lng: 106.6297 }, // Ho Chi Minh City
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
      addTestResult('Map Instance', true, 'Map instance created successfully');

      setMap(mapInstance);

      // Test marker creation
      const testMarker = new google.maps.Marker({
        position: { lat: 10.8231, lng: 106.6297 },
        map: mapInstance,
        title: 'Test Marker',
        icon: {
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjRkY2QjM1Ii8+Cjwvc3ZnPgo=',
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40)
        }
      });
      addTestResult('Marker Creation', true, 'Test marker created successfully');

      // Test info window
      const infoWindow = new google.maps.InfoWindow({
        content: '<div style="padding: 10px;"><h3>Test Marker</h3><p>This is a test marker to verify Google Maps functionality.</p></div>'
      });
      addTestResult('Info Window', true, 'Info window created successfully');

      // Test marker click listener
      testMarker.addListener('click', () => {
        infoWindow.open(mapInstance, testMarker);
        addTestResult('Marker Click', true, 'Marker click listener working');
      });
      addTestResult('Event Listener', true, 'Click event listener added successfully');

      // Add multiple test markers
      const testLocations = [
        { lat: 10.8231, lng: 106.6297, name: 'Ben Thanh Market' },
        { lat: 10.8267, lng: 106.6958, name: 'Bui Vien Street' },
        { lat: 10.7769, lng: 106.7009, name: 'Pho 24' }
      ];

      testLocations.forEach((location, index) => {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: mapInstance,
          title: location.name,
          label: (index + 1).toString()
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 10px;"><h3>${location.name}</h3><p>Test location ${index + 1}</p></div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });
      });
      addTestResult('Multiple Markers', true, `${testLocations.length} additional markers created`);

      setLoading(false);
      addTestResult('Test Complete', true, 'All tests completed successfully');

    } catch (err) {
      console.error('Error in map test:', err);
      addTestResult('Error', false, err.message);
      setError(err.message || 'Failed to load Google Maps');
      setLoading(false);
    }
  };

  const testApiConnection = async () => {
    try {
      addTestResult('API Connection Test', true, 'Testing API connection...');
      
      // Test if we can load the Google Maps script directly
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,drawing,geometry,geocoding`;
      
      const response = await fetch(scriptUrl, { method: 'HEAD' });
      if (response.ok) {
        addTestResult('Direct API Test', true, 'Google Maps API is accessible');
      } else {
        addTestResult('Direct API Test', false, `API returned status: ${response.status}`);
      }
    } catch (err) {
      addTestResult('Direct API Test', false, err.message);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🗺️ Google Maps API Test</h1>
      <p>This page tests if Google Maps API is working correctly.</p>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Configuration</h3>
        <p><strong>API Key:</strong> {apiKey ? `${apiKey.substring(0, 10)}...` : 'Not configured'}</p>
        <p><strong>Status:</strong> {loading ? 'Loading...' : error ? 'Error' : 'Ready'}</p>
        {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
        <div style={{ flex: 1 }}>
          <h3>Map Test</h3>
          <div 
            ref={mapRef}
            style={{ 
              width: '100%', 
              height: '500px', 
              border: '2px solid #ddd', 
              borderRadius: '8px',
              background: loading ? '#f0f0f0' : 'transparent'
            }}
          >
            {loading && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#666'
              }}>
                Loading Google Maps...
              </div>
            )}
          </div>
          <div style={{ marginTop: '10px' }}>
            <button onClick={testApiConnection} style={{ padding: '10px 20px', marginRight: '10px' }}>
              Test API Connection
            </button>
            <button onClick={initializeTestMap} style={{ padding: '10px 20px' }}>
              Reload Map
            </button>
          </div>
        </div>

        <div style={{ flex: 1, maxHeight: '500px', overflow: 'auto' }}>
          <h3>Test Results</h3>
          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
            {testResults.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No tests run yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div 
                  key={index} 
                  style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    borderLeft: `4px solid ${result.success ? '#4CAF50' : '#F44336'}`,
                    background: result.success ? '#E8F5E8' : '#FFEBEE'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: result.success ? '#2E7D32' : '#C62828' }}>
                    {result.success ? '✅' : '❌'} {result.test}
                  </div>
                  {result.details && (
                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                      {result.details}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8em', color: '#999', marginTop: '4px' }}>
                    {result.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h3>Instructions</h3>
        <ul>
          <li>If the map loads and you see markers, Google Maps API is working correctly</li>
          <li>Click on markers to test info windows</li>
          <li>If you see errors, check the test results panel for details</li>
          <li>If API key issues are reported, update your .env file with a valid Google Maps API key</li>
        </ul>
      </div>
    </div>
  );
};

export default MapTest; 