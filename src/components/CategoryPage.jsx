import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import FilterSection from './FilterSection';
import ResortCard from './ResortCard';
import ResortModal from './ResortModal';
import { supabase } from '../supabaseClient';
import { getCategoryByRoute, getCategoryByType } from './categoryConfig';
import './landingpage.css';

const CATEGORY_DESCRIPTIONS = {
  budget: 'Affordable resorts that keep your stay simple and comfortable.',
  premium: 'Premium resorts with upgraded rooms and amenities.',
  bamboo: 'Bamboo-themed resorts with a nature-first stay experience.',
};

const CategoryPage = () => {
  const navigate = useNavigate();
  const { categoryRoute } = useParams();
  const category = getCategoryByRoute(categoryRoute);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResort, setSelectedResort] = useState(null);
  const [logoTapCount, setLogoTapCount] = useState(0);

  useEffect(() => {
    if (!category) return;
    const fetchResorts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('resorts').select('*, reviews(*)');
        if (error) throw error;
        setResorts(data || []);
      } catch (error) {
        console.error('Error fetching resorts:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResorts();
  }, [category]);

  const handleLogoTap = () => {
    const nextCount = logoTapCount + 1;
    setLogoTapCount(nextCount);
    if (nextCount >= 3) {
      navigate('/admin');
    }
    setTimeout(() => setLogoTapCount(0), 2000);
  };

  const handleFilterSelect = (filterType) => {
    const selectedCategory = getCategoryByType(filterType);
    if (selectedCategory) {
      navigate(`/category/${selectedCategory.route}`);
    }
  };

  const handleResortUpdate = (updatedResort) => {
    setResorts((currentResorts) =>
      currentResorts.map((resort) => (resort.id === updatedResort.id ? updatedResort : resort))
    );
    setSelectedResort(updatedResort);
  };

  const categoryResorts = useMemo(() => {
    if (!category) return [];
    return resorts.filter((resort) => resort.type === category.type);
  }, [category, resorts]);

  if (!category) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="landing-wrapper">
      <header className="landing-top-brand-area">
        <button type="button" className="landing-brand-logo" onClick={handleLogoTap}>
          Pinoxx Getaways
        </button>
      </header>

      <section className="landing-welcome-section">
        <div className="landing-welcome-content">
          <p className="landing-eyebrow">Category Page</p>
          <h1 className="landing-welcome-title">{category.label}</h1>
          <p className="landing-welcome-subtitle">{CATEGORY_DESCRIPTIONS[category.type]}</p>
          <button type="button" className="landing-back-home-btn" onClick={() => navigate('/all-categories')}>
            Back To All Categories
          </button>
        </div>
      </section>

      <FilterSection activeFilter={category.type} onFilterSelect={handleFilterSelect} />

      <main className="landing-main-content">
        {loading ? (
          <div className="landing-loading-spinner" aria-label="Loading resorts" />
        ) : categoryResorts.length ? (
          <section className="landing-resort-section">
            <div className="landing-resorts-grid">
              {categoryResorts.map((resort) => (
                <ResortCard
                  key={resort.id}
                  resort={resort}
                  onClick={() => setSelectedResort(resort)}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="landing-resort-section">
            <p className="landing-no-data-text">No resorts available in {category.label} right now.</p>
          </section>
        )}
      </main>

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

export default CategoryPage;
