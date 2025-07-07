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

const fetchMaps = async (userId = null, searchTerm = null, publicOnly = false, limit = null, offset = null, sortBy = 'created_at', order = 'DESC') => {
  try {
    let queryText = `
      SELECT m.id, m.user_id, m.title, m.description, m.is_public, m.center_lat, m.center_lng, 
             m.zoom_level, m.thumbnail_url, m.created_at, m.updated_at,
             u.username as author_name
      FROM maps m 
      LEFT JOIN users u ON m.user_id = u.id
    `;
    let queryParams = [];
    const conditions = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`m.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    } else if (publicOnly) {
      conditions.push(`m.is_public = TRUE`);
    } else {
      conditions.push(`m.is_public = TRUE`);
    }

    if (searchTerm) {
      conditions.push(`(m.title ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex})`);
      queryParams.push(`%${searchTerm}%`); 
      paramIndex++;
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add sorting
    const validSortColumns = ['created_at', 'updated_at', 'title'];
    const validOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
    
    queryText += ` ORDER BY m.${safeSortBy} ${safeOrder}`;

    // Add pagination
    if (limit) {
      queryText += ` LIMIT $${paramIndex}`;
      queryParams.push(limit);
      paramIndex++;
    }

    if (offset) {
      queryText += ` OFFSET $${paramIndex}`;
      queryParams.push(offset);
      paramIndex++;
    }

    queryText += `;`;

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
    
    if (rows.length === 0) {
      return null;
    }
    
    const map = rows[0];
    
    // Fetch markers for this map
    const markersResult = await client.query(`
      SELECT id, map_id, name, description, latitude, longitude, image_url, order_index, created_at, updated_at
      FROM markers WHERE map_id = $1 ORDER BY order_index;
    `, [mapId]);
    
    map.markers = markersResult.rows;
    
    return map;
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