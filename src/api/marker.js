const express = require('express');
const markersRouter = express.Router(); 
const {
  createMarker,
  fetchMarkers,
  getMarkerById,
  updateMarker,
  deleteMarker
} = require('../db/markers'); 
const { getMapById } = require('../db/maps'); 
const { authRequired } = require('./middleware/auth'); 

markersRouter.get('/:mapId', async (req, res, next) => {
  try {
    const mapId = req.params.mapId;
    const searchTerm = req.query.search; 

    const map = await getMapById(mapId);
    if (!map) {
      return res.status(404).send({ message: 'Map not found.' });
    }

    if (!map.is_public && (!req.user || req.user.id !== map.user_id)) {
      return res.status(403).send({ message: 'Access denied to markers of a private map.' });
    }

    const markers = await fetchMarkers(mapId, searchTerm); 
    res.send(markers);
  } catch (error) {
    next(error);
  }
});

markersRouter.get('/single/:id', async (req, res, next) => {
  try {
    const markerId = req.params.id;
    const marker = await getMarkerById(markerId);
    if (!marker) {
      return res.status(404).send({ message: 'Marker not found.' });
    }
   
    const map = await getMapById(marker.map_id);
    if (!map || (!map.is_public && (!req.user || req.user.id !== map.user_id))) {
      return res.status(403).send({ message: 'Access denied to marker on a private map.' });
    }
    res.send(marker);
  } catch (error) {
    next(error);
  }
});

markersRouter.post('/', authRequired, async (req, res, next) => {
  try {
    const { mapId, name, description, latitude, longitude, imageUrl, orderIndex } = req.body;
    if (!mapId || !name || !latitude || !longitude) {
        return res.status(400).send({ message: 'Map ID, name, latitude, and longitude are required to create a marker.' });
    }

    const map = await getMapById(mapId);
    if (!map) {
      return res.status(404).send({ message: 'Map not found.' });
    }
    if (map.user_id !== req.user.id) {
      return res.status(403).send({ message: 'You are not authorized to add markers to this map.' });
    }

    const newMarker = await createMarker({
      mapId, name, description, latitude, longitude, imageUrl, orderIndex
    });
    res.status(201).send(newMarker);
  } catch (error) {
    next(error);
  }
});

markersRouter.put('/:id', authRequired, async (req, res, next) => {
  try {
    const markerId = req.params.id;
    const updates = req.body;

    const existingMarker = await getMarkerById(markerId);
    if (!existingMarker) {
      return res.status(404).send({ message: 'Marker not found.' });
    }

    const map = await getMapById(existingMarker.map_id);
    if (!map || map.user_id !== req.user.id) {
      return res.status(403).send({ message: 'You are not authorized to update this marker.' });
    }

    const updatedMarker = await updateMarker(markerId, updates);
    res.send(updatedMarker);
  } catch (error) {
    next(error);
  }
});

markersRouter.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const markerId = req.params.id;

    const existingMarker = await getMarkerById(markerId);
    if (!existingMarker) {
      return res.status(404).send({ message: 'Marker not found.' });
    }

    const map = await getMapById(existingMarker.map_id);
    
    if (!map || map.user_id !== req.user.id) {
      return res.status(403).send({ message: 'You are not authorized to delete this marker.' });
    }

    await deleteMarker(markerId);
    res.send({ message: 'Marker deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = markersRouter;