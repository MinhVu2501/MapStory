// mapstory-frontend/src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import '../components/Navbar.css'; // CSS file is in the components directory

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">MapStory Creator</Link> {/* Link to your Home page */}
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          {/* Placeholder for future links like "Maps", "Login", "Register" */}
          <Link to="/maps">Maps</Link> {/* This route doesn't exist yet, but we'll add it */}
        </li>
        <li>
          <Link to="/login">Login</Link> {/* Placeholder */}
        </li>
        <li>
          <Link to="/register">Register</Link> {/* Placeholder */}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;