require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');

const PORT = process.env.PORT || 3000;

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


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});