import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import '../components/Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const handleUserLogin = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    window.addEventListener('userLogin', handleUserLogin);

    return () => {
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🗺️ MapStory Creator</Link>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">🏠 Home</Link>
        </li>
        <li>
          <Link to="/community">🌍 Community</Link>
        </li>
        <li>
          <Link to="/editor">📝 Create Map</Link>
        </li>
        <li>
          <Link to="/explore">🔍 Explore</Link>
        </li>
        {user && (
          <li>
            <Link to="/my-maps">🗺️ My Maps</Link>
          </li>
        )}
        {!user ? (
          <>
            <li>
              <Link to="/login">🔐 Sign In</Link>
            </li>
            <li>
              <Link to="/register">📝 Sign Up</Link>
            </li>
          </>
        ) : (
          <li className="user-section">
            <span className="username">Hello, {user.username}!</span>
            <button onClick={handleLogout} className="logout-btn">🚪 Sign Out</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;