// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3001'
  },
  production: {
    baseURL: 'https://mapstory.onrender.com'
  }
};

// Determine environment
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const environment = isProduction ? 'production' : 'development';

// Export the API base URL
export const API_BASE_URL = API_CONFIG[environment].baseURL;

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export default API_BASE_URL; 