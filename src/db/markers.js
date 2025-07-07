const client = require('../../client'); 

const createMarker = async ({ mapId, name, description, latitude, longitude, imageUrl, orderIndex = 0 }) => {
  try {
    const { rows } = await client.query(`
      INSERT INTO markers (map_id, name, description, latitude, longitude, image_url, order_index)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, map_id, name, description, latitude, longitude, image_url, order_index, created_at, updated_at;
    `, [mapId, name, description, latitude, longitude, imageUrl, orderIndex]);
    return rows[0];
  } catch (error) {
    console.error('Error in createMarker:', error);
    throw new Error('Error creating marker: ' + error.message);
  }
};

const fetchMarkers = async (mapId, searchTerm = null) => { 
  try {
    let queryText = `SELECT id, map_id, name, description, latitude, longitude, image_url, order_index, created_at, updated_at FROM markers WHERE map_id = $1`;
    let queryParams = [mapId];
    let paramIndex = 2; 


    if (searchTerm) {
      queryText += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${searchTerm}%`); 
    }

    queryText += ` ORDER BY order_index ASC, created_at ASC;`; 

    const { rows } = await client.query(queryText, queryParams);
    return rows;
  } catch (error) {
    console.error('Error in fetchMarkers:', error);
    throw new Error('Error fetching markers: ' + error.message);
  }
};

const getMarkerById = async (markerId) => {
  try {
    const { rows } = await client.query(`
      SELECT id, map_id, name, description, latitude, longitude, image_url, order_index, created_at, updated_at
      FROM markers WHERE id = $1;
    `, [markerId]);
    return rows[0];
  } catch (error) {
    console.error('Error in getMarkerById:', error);
    throw new Error('Error fetching marker by ID: ' + error.message);
  }
};

const updateMarker = async (markerId, updates) => {
  try {
    const setClauses = [];
    const queryParams = [markerId];
    let paramIndex = 2; 

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        queryParams.push(updates[key]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return getMarkerById(markerId); 
    }

    const queryText = `
      UPDATE markers
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, map_id, name, description, latitude, longitude, image_url, order_index, created_at, updated_at;
    `;

    const { rows } = await client.query(queryText, queryParams);
    return rows[0];
  } catch (error) {
    console.error('Error in updateMarker:', error);
    throw new Error('Error updating marker: ' + error.message);
  }
};

const deleteMarker = async (markerId) => {
  try {
    await client.query(`DELETE FROM markers WHERE id = $1;`, [markerId]);
    console.log(`Marker with ID ${markerId} deleted.`);
  } catch (error) {
    console.error('Error in deleteMarker:', error);
    throw new Error('Error deleting marker: ' + error.message);
  }
};

module.exports = {
  createMarker,
  fetchMarkers,
  getMarkerById,
  updateMarker,
  deleteMarker
};