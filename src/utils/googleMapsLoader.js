import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance = null;
let googleMapsPromise = null;

// List of known placeholder/invalid API keys
const PLACEHOLDER_KEYS = [
  'YOUR_GOOGLE_MAPS_API_KEY',
  'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',
  'AIzaSyBkNaAGLEVq0YYQQFMaX_mOA3mHp-vcaM0',
  'AIzaSyD9aOKdPHJVXHOBnHmJwPQqfGHJrQhyGzQ'
];

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
    }

    if (PLACEHOLDER_KEYS.includes(apiKey)) {
      throw new Error('You are using a placeholder Google Maps API key. Please get a valid API key from Google Cloud Console.');
    }

    loaderInstance = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'drawing', 'geometry', 'geocoding'],
      region: 'US',
      language: 'en'
    });
  }
  
  return loaderInstance;
};

export const loadGoogleMaps = async () => {
  if (!googleMapsPromise) {
    try {
      googleMapsPromise = getGoogleMapsLoader().load();
    } catch (error) {
      // Reset promise on error so it can be retried
      googleMapsPromise = null;
      throw error;
    }
  }
  return googleMapsPromise;
};

// Utility function to check if API key is valid
export const isValidApiKey = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return apiKey && !PLACEHOLDER_KEYS.includes(apiKey);
};

// Utility function to get API key status
export const getApiKeyStatus = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return {
      isValid: false,
      message: 'No API key configured',
      instruction: 'Add VITE_GOOGLE_MAPS_API_KEY to your .env file'
    };
  }
  
  if (PLACEHOLDER_KEYS.includes(apiKey)) {
    return {
      isValid: false,
      message: 'Using placeholder API key',
      instruction: 'Get a real API key from Google Cloud Console'
    };
  }
  
  return {
    isValid: true,
    message: 'API key configured',
    instruction: 'API key appears to be valid'
  };
}; 