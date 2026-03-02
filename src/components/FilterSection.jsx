import React from 'react';

const FilterSection = ({ activeFilter, setActiveFilter }) => {
  const filters = [
    { id: 'all', label: 'All Stays' },
    { id: 'budget', label: 'Budget Stay' },
    { id: 'premium', label: 'Premium Stay' },
    { id: 'bamboo', label: 'Bamboo Stay' },
  ];

  return (
    <div className="filter-wrapper">
      <div className="filter-buttons">
        {filters.map(filter => (
          <button
            key={filter.id}
            className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterSection;