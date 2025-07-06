// src/api/maps.js
const express = require('express');
const mapsRouter = express.Router(); // This creates an Express Router
const {
  createMap,
  fetchMaps,
  getMapById,
  updateMap,
  deleteMap
} = require('../db/maps'); // Path to your src/db/maps.js
const { authRequired } = require('./middleware/auth'); // Path to your auth middleware

// GET /api/maps (fetch all public maps, no auth needed)
mapsRouter.get('/', async (req, res, next) => {
  try {
    const maps = await fetchMaps(); // fetches public maps by default
    res.send(maps);
  } catch (error) {
    next(error);
  }
});

// GET /api/maps/my-maps (fetch maps for authenticated user)
// This route requires authentication
mapsRouter.get('/my-maps', authRequired, async (req, res, next) => {
    try {
        // req.user is set by authRequired middleware
        const userMaps = await fetchMaps(req.user.id); // pass user ID to fetch their maps
        res.send(userMaps);
    } catch (error) {
        next(error);
    }
});

// GET /api/maps/:id (fetch a single map by ID)
mapsRouter.get('/:id', async (req, res, next) => {
  try {
    const map = await getMapById(req.params.id);
    if (map) {
      // If map is private, ensure authenticated user is the owner
      // req.user might not exist if authRequired middleware wasn't used for this GET route
      if (!map.is_public && (!req.user || req.user.id !== map.user_id)) {
        return res.status(403).send({ message: 'Access denied to private map.' });
      }
      res.send(map);
    } else {
      res.status(404).send({ message: 'Map not found.' });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/maps (create a new map, requires authentication)
mapsRouter.post('/', authRequired, async (req, res, next) => {
  try {
    const { title, description, isPublic, centerLat, centerLng, zoomLevel, thumbnailUrl } = req.body;
    if (!title || !centerLat || !centerLng || !zoomLevel) {
        return res.status(400).send({ message: 'Title, center coordinates, and zoom level are required to create a map.' });
    }
    const newMap = await createMap({
      userId: req.user.id, // Associate with the authenticated user
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

// PUT /api/maps/:id (update a map, requires authentication and ownership)
mapsRouter.put('/:id', authRequired, async (req, res, next) => {
  try {
    const mapId = req.params.id;
    const updates = req.body;

    const existingMap = await getMapById(mapId);
    if (!existingMap) {
      return res.status(404).send({ message: 'Map not found.' });
    }

    // Ensure authenticated user owns the map
    if (existingMap.user_id !== req.user.id) {
      return res.status(403).send({ message: 'You are not authorized to update this map.' });
    }

    const updatedMap = await updateMap(mapId, updates);
    res.send(updatedMap);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/maps/:id (delete a map, requires authentication and ownership)
mapsRouter.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const mapId = req.params.id;

    const existingMap = await getMapById(mapId);
    if (!existingMap) {
      return res.status(404).send({ message: 'Map not found.' });
    }

    // Ensure authenticated user owns the map
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