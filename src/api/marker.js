// src/api/markers.js
const express = require('express');
const markersRouter = express.Router(); // This creates an Express Router
const {
  createMarker,
  fetchMarkers,
  getMarkerById,
  updateMarker,
  deleteMarker
} = require('../db/markers'); // Path to your src/db/markers.js
const { getMapById } = require('../db/maps'); // Need this to check map ownership for markers
const { authRequired } = require('./middleware/auth'); // Path to your auth middleware

// GET /api/markers/:mapId (fetch all markers for a specific map)
markersRouter.get('/:mapId', async (req, res, next) => {
  try {
    const mapId = req.params.mapId;
    const map = await getMapById(mapId);
    if (!map) {
      return res.status(404).send({ message: 'Map not found.' });
    }
    // If map is private, ensure authenticated user is the owner (if authRequired isn't used here)
    if (!map.is_public && (!req.user || req.user.id !== map.user_id)) {
      return res.status(403).send({ message: 'Access denied to markers of a private map.' });
    }

    const markers = await fetchMarkers(mapId);
    res.send(markers);
  } catch (error) {
    next(error);
  }
});

// GET /api/markers/single/:id (fetch a single marker by its ID)
markersRouter.get('/single/:id', async (req, res, next) => {
  try {
    const markerId = req.params.id;
    const marker = await getMarkerById(markerId);
    if (!marker) {
      return res.status(404).send({ message: 'Marker not found.' });
    }
    // Check map visibility: If marker's map is private, ensure authenticated user is owner
    const map = await getMapById(marker.map_id);
    if (!map || (!map.is_public && (!req.user || req.user.id !== map.user_id))) {
      return res.status(403).send({ message: 'Access denied to marker on a private map.' });
    }
    res.send(marker);
  } catch (error) {
    next(error);
  }
});


// POST /api/markers (create a new marker, requires authentication and map ownership)
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
    // Ensure authenticated user owns the map
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

// PUT /api/markers/:id (update a marker, requires authentication and map ownership)
markersRouter.put('/:id', authRequired, async (req, res, next) => {
  try {
    const markerId = req.params.id;
    const updates = req.body;

    const existingMarker = await getMarkerById(markerId);
    if (!existingMarker) {
      return res.status(404).send({ message: 'Marker not found.' });
    }

    const map = await getMapById(existingMarker.map_id);
    // Ensure authenticated user owns the map (and thus the marker)
    if (!map || map.user_id !== req.user.id) {
      return res.status(403).send({ message: 'You are not authorized to update this marker.' });
    }

    const updatedMarker = await updateMarker(markerId, updates);
    res.send(updatedMarker);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/markers/:id (delete a marker, requires authentication and map ownership)
markersRouter.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const markerId = req.params.id;

    const existingMarker = await getMarkerById(markerId);
    if (!existingMarker) {
      return res.status(404).send({ message: 'Marker not found.' });
    }

    const map = await getMapById(existingMarker.map_id);
    // Ensure authenticated user owns the map (and thus the marker)
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