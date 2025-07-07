// mapstory-frontend/src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './page/Navbar'; // <--- CORRECTED: Navbar is in the page directory
import Home from './page/Home'; // <--- CORRECTED: Home is in the page directory
import './index.css'; // <--- CORRECTED: Use the existing index.css file

function App() {
  return (
    <div className="App">
      <Navbar /> {/* <--- NEW: Render the Navbar component here */}
      
      <main> {/* Optional: Wrap your Routes in a <main> tag for semantics */}
        <Routes>
          <Route path="/" element={<Home />} />
          {/* You'll add more routes here later */}
        </Routes>
      </main>

      {/* You can add a global footer here later */}
    </div>
  );
}

export default App;