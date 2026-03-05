import React from 'react';

const getAnimationDelay = (id) => {
  const text = String(id ?? '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 300;
  }
  return `${(hash / 1000).toFixed(3)}s`;
};

const ResortCard = ({ resort, onClick }) => {
  const mainImage = resort.images && resort.images.length > 0
    ? resort.images[0]
    : 'https://via.placeholder.com/400x300?text=No+Image';

  const animationDelay = getAnimationDelay(resort.id);
  const displayPrice = resort.price_sharing || resort.price || 'N/A';

  return (
    <button
      type="button"
      className="landing-resort-card"
      onClick={onClick}
      style={{ animationDelay }}
    >
      <div className="landing-card-image">
        <img src={mainImage} alt={resort.name} />
        <div className={`landing-card-tag ${resort.type}`}>{resort.type}</div>
      </div>

      <div className="landing-card-content">
        <h3>{resort.name}</h3>
        <p className="landing-card-location">
          Location: {resort.location || 'Not specified'}
        </p>
        <p className="landing-card-description">{resort.description?.substring(0, 90) || 'No description available.'}</p>

        <div className="landing-card-footer">
          <div className="landing-price">Price: {displayPrice}</div>
          <span className="landing-view-btn">View Details</span>
        </div>
      </div>
    </button>
  );
};

export default ResortCard;
