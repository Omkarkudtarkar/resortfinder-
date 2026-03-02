import React from 'react';

const ResortCard = ({ resort, onClick }) => {
  // Fallback image if array is empty
  const mainImage = resort.images && resort.images.length > 0 
    ? resort.images[0] 
    : 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <div className="resort-card" onClick={onClick} style={{animationDelay: `${Math.random() * 0.3}s`}}>
      <div className="card-image">
        <img src={mainImage} alt={resort.name} />
        <div className={`card-tag ${resort.type}`}>{resort.type}</div>
      </div>

      <div className="card-content">
        <h3>{resort.name}</h3>
        <p style={{fontSize: '0.9rem', color: '#aaa', marginBottom: '5px'}}>
          📍 {resort.location || 'Location not specified'}
        </p>
        <p>{resort.description?.substring(0, 60)}...</p>
        
        <div className="card-footer">
          <div className="price">{resort.price}</div>
          <button className="filter-btn" style={{padding: '8px 15px', fontSize: '0.8rem', pointerEvents: 'none'}}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResortCard;