const express = require('express');
const mapsRouter = express.Router();
const {
  createMap,
  fetchMaps, 
  getMapById,
  updateMap,
  deleteMap
} = require('../db/maps'); 
const { fetchMarkers } = require('../db/markers'); 
const { authRequired } = require('./middleware/auth'); 


mapsRouter.get('/', async (req, res, next) => {
  try {
    const searchTerm = req.query.search; 
    
    const maps = await fetchMaps(null, searchTerm); 
    res.send(maps);
  } catch (error) {
    next(error); 
  }
});

mapsRouter.get('/my-maps', authRequired, async (req, res, next) => {
    try {
        const userMaps = await fetchMaps(req.user.id); 
        res.send(userMaps);
    } catch (error) {
        next(error);
    }
});


mapsRouter.get('/:id', async (req, res, next) => {
  try {
    const map = await getMapById(req.params.id);
    if (!map) {
      return res.status(404).send({ message: 'Map not found.' });
    }
   
    if (!map.is_public && (!req.user || req.user.id !== map.user_id)) {
      return res.status(403).send({ message: 'Access denied to private map.' });
    }
    res.send(map);
  } catch (error) {
    next(error);
  }
});


mapsRouter.post('/', authRequired, async (req, res, next) => {
  try {
    const { title, description, isPublic, centerLat, centerLng, zoomLevel, thumbnailUrl } = req.body;
   
    if (!title || !centerLat || !centerLng || !zoomLevel) {
        return res.status(400).send({ message: 'Title, center coordinates, and zoom level are required to create a map.' });
    }
    const newMap = await createMap({
      userId: req.user.id,
      title,
      description,
      isPublic,
      centerLat,
      centerLng,
      zoomLevel,
      thumbnailUrl
    });
    res.status(201).send(newMap);
  } catch (error) {
    next(error);
  }
});


mapsRouter.put('/:id', authRequired, async (req, res, next) => {
  try {
    const mapId = req.params.id;
    const updates = req.body;

    const existingMap = await getMapById(mapId);
    if (!existingMap) {
      return res.status(404).send({ message: 'Map not found.' });
    }
    
    if (existingMap.user_id !== req.user.id) {
      return res.status(403).send({ message: 'You are not authorized to update this map.' });
    }

    const updatedMap = await updateMap(mapId, updates);
    res.send(updatedMap);
  } catch (error) {
    next(error);
  }
});


mapsRouter.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const mapId = req.params.id;

    const existingMap = await getMapById(mapId);
    if (!existingMap) {
      return res.status(404).send({ message: 'Map not found.' });
    }
  
    if (existingMap.user_id !== req.user.id) {
      return res.status(403).send({ message: 'You are not authorized to delete this map.' });
    }

    await deleteMap(mapId);
    res.send({ message: 'Map deleted successfully.' });
  } catch (error) {
    next(error);
  }
});


module.exports = mapsRouter;