import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api';

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'popular', 'recent'
  const [sortBy, setSortBy] = useState('views'); // 'views', 'likes', 'newest', 'name'
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    filterAndSortRoutes();
  }, [routes, searchQuery, filterBy, sortBy]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/maps'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      
      const data = await response.json();
      // Filter maps that have routes (maps with multiple markers or predefined routes)
      const routeMaps = data.filter(map => 
        ['Saigon Food Tour', 'Historical Landmarks of Hanoi', 'Tokyo Highlights'].includes(map.title) ||
        (map.markers && map.markers.length >= 2)
      );
      
      setRoutes(routeMaps);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRoutes = () => {
    let filtered = [...routes];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(route =>
        route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (route.author_name && route.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (filterBy === 'popular') {
      filtered = filtered.filter(route => (route.likes || 0) >= 5);
    } else if (filterBy === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(route => new Date(route.created_at) >= oneWeekAgo);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredRoutes(filtered);
  };

  const handleRouteClick = (routeId) => {
    navigate(`/map/${routeId}`);
  };

  const getRouteTypeIcon = (title) => {
    if (title.toLowerCase().includes('food')) return '🍜';
    if (title.toLowerCase().includes('historical') || title.toLowerCase().includes('landmarks')) return '🏛️';
    if (title.toLowerCase().includes('tokyo') || title.toLowerCase().includes('highlights')) return '🗼';
    return '🗺️';
  };

  return (
    <div className="routes-page">
      <div className="routes-header">
        <div className="container">
          <h1>🗺️ Discover Routes</h1>
          <p>Explore curated walking routes with detailed directions and local insights</p>
        </div>
      </div>

      <div className="routes-content">
        <div className="container">
          {/* Search and Filter Controls */}
          <div className="routes-controls">
            <div className="search-section">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search routes by name, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="route-search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-group">
                <label>Filter by:</label>
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                  <option value="all">All Routes</option>
                  <option value="popular">Popular (5+ likes)</option>
                  <option value="recent">Recent (Last 7 days)</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                  <option value="newest">Newest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Routes Results */}
          {loading ? (
            <div className="routes-loading">
              <div className="loading-spinner"></div>
              <p>Loading routes...</p>
            </div>
          ) : (
            <>
              <div className="routes-summary">
                <p>{filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''} found</p>
              </div>

              <div className="routes-grid">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route) => (
                    <div 
                      key={route.id} 
                      className="route-card enhanced" 
                      onClick={() => handleRouteClick(route.id)}
                    >
                      <div className="route-card-header">
                        <div className="route-icon">
                          {getRouteTypeIcon(route.title)}
                        </div>
                        <div className="route-stats">
                          <span className="route-views">👁️ {route.views || 0}</span>
                          <span className="route-likes">❤️ {route.likes || 0}</span>
                        </div>
                      </div>

                      <h3 className="route-title">{route.title}</h3>
                      <p className="route-description">{route.description}</p>

                      <div className="route-meta">
                        <span className="route-author">By {route.author_name || 'Anonymous'}</span>
                        <span className="route-date">
                          {new Date(route.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="route-features">
                        <span className="feature-tag">🚶‍♂️ Walking</span>
                        <span className="feature-tag">📍 Multiple Stops</span>
                        <span className="feature-tag">🛣️ Optimized</span>
                        {route.is_public && <span className="feature-tag">🌍 Public</span>}
                      </div>

                      <div className="route-actions">
                        <button className="view-route-btn">
                          View Route & Directions
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-routes-found">
                    <div className="no-routes-icon">🗺️</div>
                    <h3>No routes found</h3>
                    <p>Try adjusting your search terms or filters</p>
                    <button 
                      className="create-route-btn"
                      onClick={() => navigate('/editor')}
                    >
                      Create Your Own Route
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutesPage; 