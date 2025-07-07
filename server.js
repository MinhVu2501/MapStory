require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path'); 
const client = require('./client');

const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Corrected: Allow Google Fonts for stylesheets
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com", "'unsafe-eval'"], // Added 'unsafe-eval' for some Google Maps internal scripts if needed, though generally try to avoid. You might remove if map works without it.
      scriptSrcElem: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      // Added fontSrc for the actual font files
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "https://*.googleapis.com"], // Added *.googleapis.com for broader API calls
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [], // Recommended for production
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use((req, res, next) => {
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.use('/api/users', require('./src/api/users'));
app.use('/api/maps', require('./src/api/maps'));
app.use('/api/markers', require('./src/api/marker'));


app.use(express.static(path.join(__dirname, 'dist')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.use((error, req, res, next) => {
  console.error('SERVER ERROR:', error);
  res.status(error.status || 500);
  res.send({
    name: error.name || 'ServerError',
    message: error.message || 'An unexpected error occurred.',
  });
});

const startServer = async () => {
  try {
    console.log('Attempting to connect to the database...');
    await client.connect();
    console.log('Successfully connected to the database!');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database or start server:', error);

    process.exit(1);
  }
};

startServer();