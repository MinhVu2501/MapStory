// server.js
require('dotenv').config(); // Make sure this is at the very top
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes (important for frontend communication)
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logger for development

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the MapStory Creator API!');
});

// API Routes - IMPORTANT: Require the Express Router files from src/api/
app.use('/api/users', require('./src/api/users'));       // Points to src/api/users.js
app.use('/api/maps', require('./src/api/maps'));         // Points to src/api/maps.js
app.use('/api/markers', require('./src/api/marker'));   // Points to src/api/marker.js

// Centralized Error Handling Middleware (must be after all routes)
app.use((error, req, res, next) => {
  console.error('SERVER ERROR:', error); // Log the error for internal debugging
  res.status(error.status || 500); // Use error.status if provided, else 500
  res.send({
    name: error.name || 'ServerError',
    message: error.message || 'An unexpected error occurred.',
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});