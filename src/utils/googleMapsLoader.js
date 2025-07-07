import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance = null;
let googleMapsPromise = null;

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
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

export const loadGoogleMaps = () => {
  if (!googleMapsPromise) {
    googleMapsPromise = getGoogleMapsLoader().load();
  }
  return googleMapsPromise;
}; 