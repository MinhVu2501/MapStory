require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const client = require('./client');

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://maps.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.RENDER_EXTERNAL_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:10000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (images, videos, etc.)
app.use('/images', express.static(path.join(__dirname, 'images')));

// API routes
const usersRouter = require('./src/api/users');
const mapsRouter = require('./src/api/maps');
const markersRouter = require('./src/api/marker');

app.use('/api/users', usersRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/markers', markersRouter);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app build directory with proper caching
  app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    etag: false,
    setHeaders: (res, filePath) => {
      // Don't cache index.html
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  
  // Handle React routing - send all non-API requests to React app
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  });
} else {
  // Development mode - API only
  app.get('/', (req, res) => {
    res.json({ 
      message: 'MapStory Creator API Server',
      status: 'Running in development mode',
      frontend: 'http://localhost:5173'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const startServer = async () => {
  try {
    console.log('Attempting to connect to the database...');
    await client.connect();
    console.log('Successfully connected to the database!');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 Application: http://localhost:${PORT}`);
      } else {
        console.log(`🔧 API Server: http://localhost:${PORT}`);
        console.log(`🎨 Frontend: http://localhost:5173`);
      }
    });
  } catch (error) {
    console.error('Failed to connect to the database or start server:', error);

    process.exit(1);
  }
};

startServer();