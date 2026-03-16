import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResortCard from './ResortCard';
import FilterSection from './FilterSection';
import { supabase } from '../supabaseClient';
import { CATEGORY_ORDER, getCategoryByType } from './categoryConfig';
import './landingpage.css';

const SECTION_DESCRIPTIONS = {
  budget: 'Value-friendly stays without compromising the essentials.',
  premium: 'Premium stays with elevated comfort and amenities.',
  bamboo: 'Nature-facing bamboo-style stays and experiences.',
};

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const scrollStorageKey = `list-scroll:${location.pathname}`;

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

  useEffect(() => {
    fetchResorts();
  }, []);

  useEffect(() => {
    if (loading) return;
    const savedScroll = sessionStorage.getItem(scrollStorageKey);
    if (!savedScroll) return;
    requestAnimationFrame(() => {
      window.scrollTo(0, Number(savedScroll));
      sessionStorage.removeItem(scrollStorageKey);
    });
  }, [loading, scrollStorageKey]);

  const handleLogoTap = () => {
    const nextCount = logoTapCount + 1;
    setLogoTapCount(nextCount);
    if (nextCount >= 3) {
      navigate('/admin');
    }
    setTimeout(() => setLogoTapCount(0), 2000);
  };

  const resortsByType = useMemo(() => {
    return CATEGORY_ORDER.reduce((acc, section) => {
      acc[section.type] = resorts.filter((resort) => resort.type === section.type);
      return acc;
    }, {});
  }, [resorts]);

  const handleFilterSelect = (filterId) => {
    setActiveFilter(filterId);
    const selectedCategory = getCategoryByType(filterId);
    if (selectedCategory) {
      navigate(`/category/${selectedCategory.route}`);
    }
  };

  const handleOpenResort = (resort) => {
    sessionStorage.setItem(scrollStorageKey, String(window.scrollY));
    navigate(`/resort/${resort.id}`, {
      state: {
        resort,
        from: location.pathname,
      },
    });
  };

  return (
    <div className="landing-wrapper">
      <header className="landing-top-brand-area">
        <button type="button" className="landing-brand-logo" onClick={handleLogoTap}>
          Pinoxx Getaways
        </button>
      </header>

      <section className="landing-welcome-section">
        <div className="landing-welcome-content">
          <p className="landing-eyebrow">Dandeli Experiences</p>
          <h1 className="landing-welcome-title">Choose Your Perfect Resort Stay</h1>
          <p className="landing-welcome-subtitle">
            Pick a category below to open a dedicated page for that stay type.
          </p>
        </div>
      </section>

      <FilterSection activeFilter={activeFilter} onFilterSelect={handleFilterSelect} />

      <main className="landing-main-content">
        {loading ? (
          <div className="landing-loading-spinner" aria-label="Loading resorts" />
        ) : (
          CATEGORY_ORDER.map((section) => (
            <section
              key={section.type}
              className="landing-resort-section"
            >
              <div className="landing-section-head">
                <h2>{section.label}</h2>
                <p>{SECTION_DESCRIPTIONS[section.type]}</p>
              </div>

              {resortsByType[section.type]?.length ? (
                <div className="landing-resorts-grid">
                  {resortsByType[section.type].map((resort) => (
                    <ResortCard
                      key={resort.id}
                      resort={resort}
                      onClick={() => handleOpenResort(resort)}
                    />
                  ))}
                </div>
              ) : (
                <p className="landing-no-data-text">No resorts available in this section right now.</p>
              )}
            </section>
          ))
        )}
      </main>

    </div>
  );
};

export default LandingPage;
