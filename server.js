require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const client = require('./client'); 

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next(); 
});

app.use(cors()); 
app.use(express.json()); 
app.use(morgan('dev')); 


app.get('/', (req, res) => {
  res.send('Welcome to the MapStory Creator API!');
});

app.use('/api/users', require('./src/api/users'));       
app.use('/api/maps', require('./src/api/maps'));         
app.use('/api/markers', require('./src/api/marker'));   


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