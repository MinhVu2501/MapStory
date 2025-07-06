const client = require('../../client'); 
const createMap = async ({ userId, title, description, isPublic = true, centerLat, centerLng, zoomLevel, thumbnailUrl }) => {
  try {
    const { rows } = await client.query(`
      INSERT INTO maps (user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url, created_at, updated_at;
    `, [userId, title, description, isPublic, centerLat, centerLng, zoomLevel, thumbnailUrl]);
    return rows[0];
  } catch (error) {
    console.error('Error in createMap:', error);
    throw new Error('Error creating map: ' + error.message);
  }
};

const fetchMaps = async (userId = null) => {
  try {
    let queryText = `SELECT id, user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url, created_at, updated_at FROM maps`;
    let queryParams = [];

    if (userId) {
      queryText += ` WHERE user_id = $1`;
      queryParams.push(userId);
    } else {
      queryText += ` WHERE is_public = TRUE`;
    }
    queryText += ` ORDER BY created_at DESC;`; 

    const { rows } = await client.query(queryText, queryParams);
    return rows;
  } catch (error) {
    console.error('Error in fetchMaps:', error);
    throw new Error('Error fetching maps: ' + error.message);
  }
};


const getMapById = async (mapId) => {
  try {
    const { rows } = await client.query(`
      SELECT id, user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url, created_at, updated_at
      FROM maps WHERE id = $1;
    `, [mapId]);
    return rows[0];
  } catch (error) {
    console.error('Error in getMapById:', error);
    throw new Error('Error fetching map by ID: ' + error.message);
  }
};


const updateMap = async (mapId, updates) => {
  try {
    const setClauses = [];
    const queryParams = [mapId];
    let paramIndex = 2; 

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        queryParams.push(updates[key]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return getMapById(mapId); 
    }

    const queryText = `
      UPDATE maps
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, user_id, title, description, is_public, center_lat, center_lng, zoom_level, thumbnail_url, created_at, updated_at;
    `;

    const { rows } = await client.query(queryText, queryParams);
    return rows[0];
  } catch (error) {
    console.error('Error in updateMap:', error);
    throw new Error('Error updating map: ' + error.message);
  }
};

const deleteMap = async (mapId) => {
  try {
    await client.query(`DELETE FROM maps WHERE id = $1;`, [mapId]);
    console.log(`Map with ID ${mapId} deleted.`);
  } catch (error) {
    console.error('Error in deleteMap:', error);
    throw new Error('Error deleting map: ' + error.message);
  }
};

module.exports = {
  createMap,
  fetchMaps,
  getMapById,
  updateMap,
  deleteMap
};