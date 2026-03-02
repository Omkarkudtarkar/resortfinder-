import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const ResortModal = ({ resort, onClose, onUpdate }) => {
  const [activeImage, setActiveImage] = useState(resort.images?.[0] || '');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [newReview, setNewReview] = useState({ user_name: '', rating: 5, text: '' });

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if(!newReview.user_name || !newReview.text) return;

    const reviewData = {
      resort_id: resort.id,
      ...newReview,
      date: new Date().toLocaleDateString()
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select(); // Return the inserted data

    if (error) {
      alert("Failed to post review: " + error.message);
      return;
    }

    // Update local state to show new review immediately
    const updatedResort = {
      ...resort,
      reviews: [...(resort.reviews || []), data[0]]
    };
    
    onUpdate(updatedResort);
    setNewReview({ user_name: '', rating: 5, text: '' });
  };

  const visibleReviews = showAllReviews 
    ? resort.reviews 
    : resort.reviews?.slice(0, 3);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="gallery-main">
          <img src={activeImage} alt={resort.name} />
        </div>
        
        {resort.images?.length > 1 && (
          <div className="gallery-thumbs">
            {resort.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`thumb ${idx}`}
                className={activeImage === img ? 'active' : ''}
                onClick={() => setActiveImage(img)}
              />
            ))}
          </div>
        )}

        <div className="modal-body">
          <div className="modal-header-text">
            <h2>{resort.name}</h2>
            <p className="location-text">📍 {resort.location || 'Unknown Location'}</p>
          </div>

          <p style={{margin: '20px 0', lineHeight: '1.6'}}>{resort.description}</p>

          <div className="details-grid">
            {resort.details?.pricing && (
              <div className="detail-box">
                <h4>💰 Pricing</h4>
                <div dangerouslySetInnerHTML={{ __html: resort.details.pricing }} />
              </div>
            )}
            {resort.details?.meals && (
              <div className="detail-box">
                <h4>🍽️ Meals</h4>
                <div dangerouslySetInnerHTML={{ __html: resort.details.meals }} />
              </div>
            )}
            {resort.details?.activities && (
              <div className="detail-box">
                <h4>🎢 Activities</h4>
                <div dangerouslySetInnerHTML={{ __html: resort.details.activities }} />
              </div>
            )}
          </div>

          <div className="reviews-section">
            <h3>Customer Reviews ({resort.reviews?.length || 0})</h3>
            
            {resort.reviews?.length > 0 ? (
              <>
                {visibleReviews.map(rev => (
                  <div key={rev.id} className="review-card">
                    <div className="review-header">
                      <span>{rev.user_name}</span>
                      <span className="review-stars">{'⭐'.repeat(rev.rating)}</span>
                    </div>
                    <p style={{margin: 0, color: '#ccc'}}>{rev.text}</p>
                  </div>
                ))}
                
                {resort.reviews.length > 3 && (
                  <button 
                    className="load-more-btn"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? 'Show Less' : `Load More Reviews (${resort.reviews.length - 3} left)`}
                  </button>
                )}
              </>
            ) : (
              <p style={{color: '#aaa'}}>No reviews yet. Be the first!</p>
            )}

            <form className="review-form" onSubmit={handleReviewSubmit}>
              <h4>Write a Review</h4>
              <input 
                placeholder="Your Name" 
                value={newReview.user_name}
                onChange={(e) => setNewReview({...newReview, user_name: e.target.value})}
                required
              />
              <select 
                value={newReview.rating}
                onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}
              >
                <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                <option value="4">⭐⭐⭐⭐ (4)</option>
                <option value="3">⭐⭐⭐ (3)</option>
                <option value="2">⭐⭐ (2)</option>
                <option value="1">⭐ (1)</option>
              </select>
              <textarea 
                rows="3" 
                placeholder="Share your experience..."
                value={newReview.text}
                onChange={(e) => setNewReview({...newReview, text: e.target.value})}
                required
              ></textarea>
              <button type="submit">Submit Review</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortModal;