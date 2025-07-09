import React, { useState, useEffect } from 'react';

const MapTest = () => {
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [testResults, setTestResults] = useState([]);
  const mapRef = useRef(null);

  const [tests, setTests] = useState([
    { name: 'API Key Configuration', status: 'pending', details: '' },
    { name: 'Google Maps API Loading', status: 'pending', details: '' },
    { name: 'Map Instance Creation', status: 'pending', details: '' },
    { name: 'Marker Creation', status: 'pending', details: '' },
    { name: 'Info Window', status: 'pending', details: '' },
    { name: 'Multiple Markers', status: 'pending', details: '' }
  ]);

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

  const updateTest = (index, status, details) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, details } : test
    ));
  };

  const runTests = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Test 1: API Key Configuration
    if (!apiKey) {
      updateTest(0, 'failed', 'No API key found in environment variables');
      return;
    } else if (apiKey === 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg' || 
               apiKey === 'AIzaSyBkNaAGLEVq0YYQQFMaX_mOA3mHp-vcaM0') {
      updateTest(0, 'failed', 'Using placeholder API key - you need a real Google Maps API key');
      return;
    } else {
      updateTest(0, 'passed', `API key configured: ${apiKey.substring(0, 20)}...`);
    }

    // Test 2: Google Maps API Loading
    try {
      // Load Google Maps script dynamically
      if (!window.google) {
        await loadGoogleMapsScript(apiKey);
      }
      updateTest(1, 'passed', 'Google Maps API loaded successfully');
    } catch (error) {
      updateTest(1, 'failed', `Error loading Google Maps: ${error.message}`);
      return;
    }

    // Test 3: Map Instance Creation
    try {
      const mapElement = document.getElementById('test-map');
      if (!mapElement) {
        updateTest(2, 'failed', 'Map container element not found');
        return;
      }

      const map = new window.google.maps.Map(mapElement, {
        center: { lat: 10.8231, lng: 106.6297 },
        zoom: 13
      });
      
      updateTest(2, 'passed', 'Map instance created successfully');

      // Test 4: Marker Creation
      try {
        const marker = new window.google.maps.Marker({
          position: { lat: 10.8231, lng: 106.6297 },
          map: map,
          title: 'Test Marker'
        });
        updateTest(3, 'passed', 'Marker created successfully');

        // Test 5: Info Window
        try {
          const infoWindow = new window.google.maps.InfoWindow({
            content: '<div>Test Info Window</div>'
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
          
          updateTest(4, 'passed', 'Info window created and click listener added');

          // Test 6: Multiple Markers
          try {
            const locations = [
              { lat: 10.8231, lng: 106.6297, title: 'Location 1' },
              { lat: 10.8331, lng: 106.6397, title: 'Location 2' },
              { lat: 10.8131, lng: 106.6197, title: 'Location 3' }
            ];

            locations.forEach((location, index) => {
              new window.google.maps.Marker({
                position: { lat: location.lat, lng: location.lng },
                map: map,
                title: location.title
              });
            });

            updateTest(5, 'passed', `${locations.length} markers created successfully`);
          } catch (error) {
            updateTest(5, 'failed', `Multiple markers error: ${error.message}`);
          }
        } catch (error) {
          updateTest(4, 'failed', `Info window error: ${error.message}`);
        }
      } catch (error) {
        updateTest(3, 'failed', `Marker creation error: ${error.message}`);
      }
    } catch (error) {
      updateTest(2, 'failed', `Map creation error: ${error.message}`);
    }
  };

  const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google) {
          resolve(window.google);
        } else {
          reject(new Error('Google Maps API failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };
      
      document.head.appendChild(script);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return '#4CAF50';
      case 'failed': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Google Maps API Test Suite</h1>
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '20px' 
      }}>
        <h3>⚠️ Important: Google Maps API Key Required</h3>
        <p>To use this application, you need a valid Google Maps API key. The current key is a placeholder.</p>
        <ol>
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
          <li>Create a project and enable: Maps JavaScript API, Places API, Directions API</li>
          <li>Create an API key and add it to your .env file</li>
          <li>Restart the development server</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Results:</h2>
        {tests.map((test, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '10px', 
            margin: '5px 0', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '5px',
            borderLeft: `4px solid ${getStatusColor(test.status)}`
          }}>
            <span style={{ marginRight: '10px', fontSize: '18px' }}>
              {getStatusIcon(test.status)}
            </span>
            <div style={{ flex: 1 }}>
              <strong>{test.name}</strong>
              {test.details && (
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  {test.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Test Map Container:</h3>
        <div 
          id="test-map" 
          style={{ 
            height: '400px', 
            width: '100%', 
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#666'
          }}
        >
          {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
           import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg' || 
           import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'AIzaSyBkNaAGLEVq0YYQQFMaX_mOA3mHp-vcaM0' 
           ? 'Map will appear here once you add a valid Google Maps API key' 
           : 'Loading map...'}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
        <h3>🔧 Quick Fix Instructions:</h3>
        <ol>
          <li><strong>Get API Key:</strong> Visit <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
          <li><strong>Enable APIs:</strong> Maps JavaScript API, Places API, Directions API, Geocoding API</li>
          <li><strong>Update .env:</strong> Replace <code>VITE_GOOGLE_MAPS_API_KEY</code> with your real key</li>
          <li><strong>Restart:</strong> The Vite server will automatically restart when .env changes</li>
        </ol>
      </div>
    </div>
  );
};

export default MapTest; 