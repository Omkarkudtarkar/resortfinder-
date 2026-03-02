import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPage'; // Renamed from AdminPage
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('resorts');

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">ResortFinder</div>
        
        <div className="nav-links">
          <button 
            className={`nav-tab ${currentTab === 'resorts' ? 'active' : ''}`}
            onClick={() => setCurrentTab('resorts')}
          >
            Resorts For You
          </button>
          <button 
            className={`nav-tab ${currentTab === 'owner' ? 'active' : ''}`}
            onClick={() => setCurrentTab('owner')}
          >
            Owner
          </button>
        </div>
      </nav>

      {/* Conditional Rendering */}
      {currentTab === 'resorts' ? <LandingPage /> : <AdminPanel />}
    </div>
  );
}

export default App;