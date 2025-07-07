import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './page/Navbar';
import Home from './page/Home';
import LoginPage from './page/Login';
import RegisterPage from './page/Register';
import MyMapsPage from './page/MyMapsPage';
import ExploreLocations from './page/ExploreLocations';
import './index.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<ExploreLocations />} />
          <Route path="/login" element={<LoginPage />} />       
          <Route path="/register" element={<RegisterPage />} /> 
          <Route path="/my-maps" element={<MyMapsPage />} />
          
          <Route path="*" element={<h2>404 Not Found</h2>} /> 
        </Routes>
      </main>
    </div>
  );
}

export default App;