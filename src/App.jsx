import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './page/Navbar';
import Home from './page/Home';
import LoginPage from './page/Login';
import RegisterPage from './page/Register';
import MyMapsPage from './page/MyMapsPage';
import RoutesPage from './page/RoutesPage';
import ExploreLocations from './page/ExploreLocations';
import MapView from './page/MapView';
import CommunityLibrary from './page/CommunityLibrary';
import MapEditor from './page/MapEditor';
import './index.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<ExploreLocations />} />
          <Route path="/community" element={<CommunityLibrary />} />
          <Route path="/editor" element={<MapEditor />} />
          <Route path="/login" element={<LoginPage />} />       
          <Route path="/register" element={<RegisterPage />} /> 
          <Route path="/my-maps" element={<MyMapsPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/map/:id" element={<MapView />} />
          
          <Route path="*" element={<h2>404 Not Found</h2>} /> 
        </Routes>
      </main>
    </div>
  );
}

export default App;