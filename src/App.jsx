import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPage';
import CategoryPage from './components/CategoryPage';
import ResortDetailsPage from './components/ResortDetailsPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/category/budget" replace />} />

        {/* Landing Route (Default to Budget) */}
        <Route path="/landing" element={<Navigate to="/category/budget" replace />} />

        {/* All Categories Page */}
        <Route path="/all-categories" element={<LandingPage />} />

        {/* Category Pages */}
        <Route path="/category/:categoryRoute" element={<CategoryPage />} />

        {/* Resort Details */}
        <Route path="/resort/:resortId" element={<ResortDetailsPage />} />
        
        {/* Admin Panel Route */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
