import React, { useState, useEffect } from 'react';
import ResortCard from './ResortCard';
import FilterSection from './FilterSection';
import ResortModal from './ResortModal';
import { supabase } from '../supabaseClient';

const LandingPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResort, setSelectedResort] = useState(null);

  // Fetch Resorts from Supabase
  const fetchResorts = async () => {
    try {
      setLoading(true);
      // Select resorts and their associated reviews
      const { data, error } = await supabase
        .from('resorts')
        .select('*, reviews(*)');

      if (error) throw error;
      setResorts(data || []);
    } catch (error) {
      console.error('Error fetching resorts:', error.message);
      alert('Failed to load resorts. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResorts();
  }, []);

  // Update resort data (used for adding reviews in modal)
  const handleResortUpdate = (updatedResort) => {
    // Optimistic UI update
    const newResorts = resorts.map(r => r.id === updatedResort.id ? updatedResort : r);
    setResorts(newResorts);
    setSelectedResort(updatedResort);
  };

  const filteredResorts = resorts.filter(resort => 
    activeFilter === 'all' ? true : resort.type === activeFilter
  );

  return (
    <div className="landing-page-wrapper">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title-animate">Find Your <span style={{ color: 'var(--primary)' }}>Perfect Stay</span></h1>
          <p className="hero-sub-animate">Click a resort to see details & reviews.</p>
        </div>
      </div>

      <FilterSection activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

      <div className="resorts-container">
        {loading ? (
          <p style={{ color: 'white', textAlign: 'center' }}>Loading resorts...</p>
        ) : filteredResorts.length === 0 ? (
          <p style={{ color: 'white', textAlign: 'center' }}>No resorts found.</p>
        ) : (
          filteredResorts.map(resort => (
            <ResortCard 
              key={resort.id} 
              resort={resort} 
              onClick={() => setSelectedResort(resort)} 
            />
          ))
        )}
      </div>

      {selectedResort && (
        <ResortModal 
          resort={selectedResort} 
          onClose={() => setSelectedResort(null)} 
          onUpdate={handleResortUpdate}
        />
      )}
    </div>
  );
};

export default LandingPage;