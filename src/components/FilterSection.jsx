import React from 'react';
import { CATEGORY_ORDER } from './categoryConfig';

const FilterSection = ({ activeFilter, onFilterSelect, includeAll = false }) => {
  const filterOptions = includeAll
    ? [{ type: 'all', label: 'All Stays' }, ...CATEGORY_ORDER]
    : CATEGORY_ORDER;

  return (
    <div className="landing-filter-wrapper">
      <div className="landing-filter-buttons" role="tablist" aria-label="Resort categories">
        {filterOptions.map((filter) => (
          <button
            key={filter.type}
            type="button"
            className={`landing-filter-btn ${activeFilter === filter.type ? 'active' : ''}`}
            onClick={() => onFilterSelect(filter.type)}
            aria-pressed={activeFilter === filter.type}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterSection;
