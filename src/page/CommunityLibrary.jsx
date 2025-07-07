import React, { useState, useEffect } from 'react';

const CommunityLibrary = () => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedMap, setSelectedMap] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: '🌍' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'food', name: 'Food', icon: '🍜' },
    { id: 'history', name: 'History', icon: '🏛️' },
    { id: 'nature', name: 'Nature', icon: '🌿' },
    { id: 'culture', name: 'Culture', icon: '🎭' },
    { id: 'adventure', name: 'Adventure', icon: '🏔️' }
  ];

  useEffect(() => {
    fetchCommunityMaps();
  }, [selectedCategory, sortBy]);

  const fetchCommunityMaps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/maps/public-stories?limit=20&category=${selectedCategory}&sort=${sortBy}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch community maps');
      }
      
      const data = await response.json();
      setMaps(data);
    } catch (err) {
      console.error('Error fetching community maps:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleMapClick = (map) => {
    setSelectedMap(map);
    setShowMapModal(true);
  };

  const closeMapModal = () => {
    setShowMapModal(false);
    setSelectedMap(null);
  };

  const filteredMaps = maps.filter(map => 
    map.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    map.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="community-library">
      {/* Header */}
      <header className="library-header">
        <div className="header-container">
          <div className="header-content">
            <h1>🌍 Community Library</h1>
            <p>Explore amazing map stories created by the MapStory Creator community</p>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="search-filters">
        <div className="container">
          <div className="search-bar">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                className="search-input"
                placeholder="Search maps, locations, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                🔍 Search
              </button>
            </form>
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <label>Topic:</label>
              <div className="category-filters">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                className="sort-select" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Popular</option>
                <option value="title">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Maps Grid */}
      <section className="maps-content">
        <div className="container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading community maps...</p>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2>
                  {filteredMaps.length} maps 
                  {selectedCategory !== 'all' && ` in "${categories.find(c => c.id === selectedCategory)?.name}" topic`}
                  {searchQuery && ` for "${searchQuery}"`}
                </h2>
              </div>

              <div className="maps-grid">
                {filteredMaps.map((map) => (
                  <div key={map.id} className="map-card" onClick={() => handleMapClick(map)}>
                    <div className="map-thumbnail">
                      {map.thumbnail_url ? (
                        <img src={map.thumbnail_url} alt={map.title} />
                      ) : (
                        <div className="map-placeholder">
                          <div className="map-icon">🗺️</div>
                        </div>
                      )}
                      <div className="map-overlay">
                        <button className="view-btn">View Map</button>
                      </div>
                    </div>
                    <div className="map-content">
                      <h3>{map.title}</h3>
                      <p className="map-description">{map.description}</p>
                      <div className="map-meta">
                        <div className="map-author">
                          <span className="author-avatar">👤</span>
                          <span>by {map.author_name || 'Anonymous'}</span>
                        </div>
                        <div className="map-stats">
                          <span className="stat">
                            <span className="stat-icon">👁️</span>
                            {map.views || 0}
                          </span>
                          <span className="stat">
                            <span className="stat-icon">❤️</span>
                            {map.likes || 0}
                          </span>
                        </div>
                      </div>
                      <div className="map-date">
                        {new Date(map.created_at).toLocaleDateString('en-US')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMaps.length === 0 && !loading && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No maps found</h3>
                  <p>Try changing your search terms or filters to find suitable maps.</p>
                  <button className="create-map-btn" onClick={() => window.location.href = '/'}>
                    Create your first map
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Featured Collections */}
      <section className="featured-collections">
        <div className="container">
          <h2>🌟 Featured Collections</h2>
          <div className="collections-grid">
            <div className="collection-card">
              <div className="collection-image">
                <div className="collection-placeholder">🍜</div>
              </div>
              <h3>World Cuisine</h3>
              <p>Explore culinary journeys across different regions</p>
              <span className="collection-count">12 maps</span>
            </div>
            <div className="collection-card">
              <div className="collection-image">
                <div className="collection-placeholder">🏛️</div>
              </div>
              <h3>Historical Heritage</h3>
              <p>Historical stories through landmark locations</p>
              <span className="collection-count">8 maps</span>
            </div>
            <div className="collection-card">
              <div className="collection-image">
                <div className="collection-placeholder">🌿</div>
              </div>
              <h3>Wild Nature</h3>
              <p>Natural beauty through community perspectives</p>
              <span className="collection-count">15 maps</span>
            </div>
          </div>
        </div>
      </section>

      {/* Map Modal */}
      {showMapModal && selectedMap && (
        <div className="map-modal-overlay" onClick={closeMapModal}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <h2>{selectedMap.title}</h2>
              <button className="map-modal-close" onClick={closeMapModal}>×</button>
            </div>
            <div className="map-modal-content">
              <div className="map-modal-image">
                {selectedMap.thumbnail_url ? (
                  <img src={selectedMap.thumbnail_url} alt={selectedMap.title} />
                ) : (
                  <div className="modal-placeholder">
                    <div className="modal-icon">🗺️</div>
                  </div>
                )}
              </div>
              <div className="map-modal-info">
                <p className="map-modal-description">{selectedMap.description}</p>
                <div className="map-modal-meta">
                  <div className="modal-author">
                    <span className="modal-author-avatar">👤</span>
                    <div>
                      <strong>Author:</strong> {selectedMap.author_name || 'Anonymous'}
                    </div>
                  </div>
                  <div className="modal-date">
                    <strong>Created:</strong> {new Date(selectedMap.created_at).toLocaleDateString('en-US')}
                  </div>
                  <div className="modal-stats">
                    <span className="modal-stat">
                      <span className="stat-icon">👁️</span>
                      {selectedMap.views || 0} views
                    </span>
                    <span className="modal-stat">
                      <span className="stat-icon">❤️</span>
                      {selectedMap.likes || 0} likes
                    </span>
                  </div>
                </div>
                <div className="map-modal-actions">
                  <a href={`/map/${selectedMap.id}`} className="view-full-btn">
                    🗺️ View Full Map
                  </a>
                  <button className="like-btn">
                    ❤️ Like This Map
                  </button>
                  <button className="share-btn">
                    📤 Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityLibrary; 