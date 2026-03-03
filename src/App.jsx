import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPage';
import CategoryPage from './components/CategoryPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Category Pages */}
        <Route path="/category/:categoryRoute" element={<CategoryPage />} />
        
        {/* Admin Panel Route */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
