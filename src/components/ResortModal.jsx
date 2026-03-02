import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ResortModal = ({ resort, onClose, onUpdate }) => {
  // --- State ---
  const [activeImage, setActiveImage] = useState(resort.images?.[0] || '');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [newReview, setNewReview] = useState({ user_name: '', rating: 5, text: '' });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Booking State
  const [booking, setBooking] = useState({
    checkIn: '',
    checkOut: '',
    adults: 1,
    children1to5: 0,
    children6to11: 0
  });

  // --- Effects ---
  useEffect(() => {
    window.history.pushState({ modalOpen: true }, '');
    window.addEventListener('popstate', onClose);
    return () => window.removeEventListener('popstate', onClose);
  }, [onClose]);

  // --- Logic ---

  // WhatsApp Booking Logic
  const handleWhatsAppBooking = () => {
    const phoneNumber = '+91 93534 31179'; 
    
    const message = `
*Resort Inquiry* 🏖️
---------------------------
*Resort:* ${resort.name}
*Check-in:* ${booking.checkIn || 'Not Selected'}
*Check-out:* ${booking.checkOut || 'Not Selected'}
---------------------------
*Guests:*
Adults: ${booking.adults}
Children (1-5 yrs): ${booking.children1to5}
Children (6-11 yrs): ${booking.children6to11}
---------------------------
Please send me more details of this resort.
    `.trim();

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if(!newReview.user_name || !newReview.text) return;

    const reviewData = { resort_id: resort.id, ...newReview };
    const { data, error } = await supabase.from('reviews').insert([reviewData]).select();

    if (error) {
      alert("Failed to post review: " + error.message);
      return;
    }

    onUpdate({ ...resort, reviews: [...(resort.reviews || []), data[0]] });
    setNewReview({ user_name: '', rating: 5, text: '' });
  };

  const visibleReviews = showAllReviews ? resort.reviews : resort.reviews?.slice(0, 3);

  return (
    <>
      {/* Main Modal Overlay */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
          
          <button className="modal-close-btn" onClick={onClose}>&times;</button>

          {/* --- GALLERY SECTION --- */}
          <div className="gallery-section">
            <div className="main-image-wrap" onClick={() => setIsLightboxOpen(true)}>
              <img src={activeImage} alt={resort.name} />
              <div className="zoom-icon">🔍</div>
              <div className="badge-type">{resort.type}</div>
            </div>
            
            {resort.images?.length > 1 && (
              <div className="thumbnail-list">
                {resort.images.map((img, idx) => (
                  <img 
                    key={idx} src={img} alt={`thumb ${idx}`}
                    className={activeImage === img ? 'active' : ''}
                    onClick={() => setActiveImage(img)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* --- BODY SECTION --- */}
          <div className="modal-body-large">
            
            {/* Header Info */}
            <div className="resort-header-large">
              <h2>{resort.name}</h2>
              <p className="location">📍 {resort.location}</p>
              
              <div className="quick-info-bar">
                {resort.distance_dandeli && <span>🚗 {resort.distance_dandeli} from Dandeli</span>}
                {resort.distance_hub && <span>📍 {resort.distance_hub} from Activities Hub</span>}
              </div>
            </div>

            {/* Pricing & Timings (Clear Large Cards) */}
            <div className="pricing-section">
              <div className="price-card main-price">
                <h3>💰 Package Price (All Inclusive)</h3>
                <p className="small-text">Includes Stay, Food & Water Activities</p>
                <div className="prices">
                  <div className="price-item">
                    <span>Sharing</span>
                    <strong>₹{resort.price_sharing || 'N/A'}</strong>
                    <small>/person</small>
                  </div>
                  <div className="divider"></div>
                  <div className="price-item">
                    <span>Couple</span>
                    <strong>₹{resort.price_couple || 'N/A'}</strong>
                    <small>/person</small>
                  </div>
                </div>
              </div>

              <div className="time-card">
                <div className="time-block">
                  <span>Check-in</span>
                  <strong>{resort.check_in_time || '12:00 PM'}</strong>
                </div>
                <div className="time-block">
                  <span>Check-out</span>
                  <strong>{resort.check_out_time || '11:00 AM'}</strong>
                </div>
              </div>
            </div>

            {/* Activities List */}
            <div className="activities-section">
              <div className="activity-box">
                <h4>🌊 Water Activities Included</h4>
                <p>{resort.water_activities || 'Rafting, Boating, Kayaking, Zipline, Swimming'}</p>
              </div>
              <div className="activity-box free">
                <h4>🎁 Resort Activities (Free)</h4>
                <p>{resort.activities_included || 'Campfire, Music, Indoor Games'}</p>
              </div>
            </div>

            {/* --- BOOKING SECTION --- */}
            <div className="booking-card-large">
              <h3>📅 Book Your Stay</h3>
              
              <div className="booking-form-grid">
                <div className="input-group">
                  <label>Check-in Date</label>
                  <input type="date" value={booking.checkIn} onChange={e => setBooking({...booking, checkIn: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>Check-out Date</label>
                  <input type="date" value={booking.checkOut} onChange={e => setBooking({...booking, checkOut: e.target.value})} />
                </div>
              </div>

              <div className="guests-grid">
                <div className="counter-box">
                  <label>Adults</label>
                  <input type="number" min="1" value={booking.adults} onChange={e => setBooking({...booking, adults: Number(e.target.value)})} />
                </div>
                <div className="counter-box">
                  <label>Kids (1-5) <span className="badge-free">FREE</span></label>
                  <input type="number" min="0" value={booking.children1to5} onChange={e => setBooking({...booking, children1to5: Number(e.target.value)})} />
                </div>
                <div className="counter-box">
                  <label>Kids (6-11) <span className="badge-half">50%</span></label>
                  <input type="number" min="0" value={booking.children6to11} onChange={e => setBooking({...booking, children6to11: Number(e.target.value)})} />
                </div>
              </div>

              <button className="whatsapp-btn-large" onClick={handleWhatsAppBooking}>
                <span className="icon">📱</span> 
                <span className="text">Tap to Book via WhatsApp</span>
              </button>
              <p className="terms">Children 1-5 years are complimentary. 6-11 years at 50% charge.</p>
            </div>

            {/* --- REVIEWS SECTION --- */}
            <div className="reviews-section">
              <h3>🗣️ Guest Reviews ({resort.reviews?.length || 0})</h3>
              
              {resort.reviews?.length > 0 ? (
                <div className="review-list">
                  {visibleReviews.map(rev => (
                    <div key={rev.id} className="review-card">
                      <div className="review-head">
                        <strong>{rev.user_name}</strong>
                        <span className="stars">{'⭐'.repeat(rev.rating)}</span>
                      </div>
                      <p>{rev.text}</p>
                    </div>
                  ))}
                  {resort.reviews.length > 3 && (
                    <button className="load-more-btn" onClick={() => setShowAllReviews(!showAllReviews)}>
                      {showAllReviews ? 'Show Less' : `Read All ${resort.reviews.length} Reviews`}
                    </button>
                  )}
                </div>
              ) : <p className="no-reviews">No reviews yet. Be the first!</p>}

              <form className="review-form" onSubmit={handleReviewSubmit}>
                <h4>Leave a Review</h4>
                <div className="form-row">
                  <input placeholder="Your Name" value={newReview.user_name} onChange={e => setNewReview({...newReview, user_name: e.target.value})} required />
                  <select value={newReview.rating} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}>
                    <option value="5">⭐⭐⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐</option>
                    <option value="3">⭐⭐⭐</option>
                  </select>
                </div>
                <textarea placeholder="Share your experience..." value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} required></textarea>
                <button type="submit" className="submit-btn">Submit Review</button>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* --- LIGHTBOX (Full Screen Image) --- */}
      {isLightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
            <button className="lightbox-close">&times;</button>
            <img src={activeImage} alt="Full Size" className="lightbox-img" />
        </div>
      )}

      {/* --- STYLES --- */}
      <style>{`
        /* Overlay */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 15px; overflow-y: auto;
        }

        /* Large Modal Content */
        .modal-content-large {
          background: #121212; width: 100%; max-width: 800px; /* Larger Width */
          border-radius: 24px; overflow: hidden; position: relative;
          max-height: 95vh; overflow-y: auto; color: #fff;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .modal-close-btn {
          position: absolute; top: 20px; right: 20px; z-index: 10;
          background: rgba(255,255,255,0.2); border: none; color: white;
          width: 40px; height: 40px; border-radius: 50%;
          font-size: 24px; cursor: pointer;
        }

        /* Gallery */
        .gallery-section { background: #000; }
        .main-image-wrap { position: relative; height: 400px; cursor: zoom-in; }
        .main-image-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .zoom-icon { position: absolute; bottom: 15px; right: 15px; background: rgba(0,0,0,0.6); padding: 8px; border-radius: 50%; font-size: 1.2rem; }
        .badge-type { position: absolute; bottom: 15px; left: 15px; background: var(--primary); color: #000; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        
        .thumbnail-list { display: flex; gap: 8px; padding: 15px; overflow-x: auto; background: #111; }
        .thumbnail-list img { width: 70px; height: 70px; object-fit: cover; border-radius: 10px; opacity: 0.5; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
        .thumbnail-list img.active { opacity: 1; border-color: var(--primary); transform: scale(1.05); }

        /* Body */
        .modal-body-large { padding: 30px; }
        
        .resort-header-large { border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 25px; }
        .resort-header-large h2 { font-size: 2rem; margin: 0 0 10px 0; }
        .location { font-size: 1.1rem; color: #aaa; margin: 0 0 15px 0; }
        .quick-info-bar { display: flex; gap: 20px; color: #ccc; font-size: 0.95rem; }

        /* Pricing Section */
        .pricing-section { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }
        
        .price-card { background: #1e1e1e; padding: 20px; border-radius: 16px; border: 1px solid #333; }
        .price-card h3 { margin: 0 0 5px 0; font-size: 1.2rem; }
        .price-card .small-text { color: #888; font-size: 0.85rem; margin-bottom: 15px; display: block; }
        .prices { display: flex; align-items: center; justify-content: space-around; }
        .price-item { text-align: center; }
        .price-item span { display: block; color: #aaa; font-size: 0.9rem; }
        .price-item strong { font-size: 1.8rem; color: #4ade80; margin: 5px 0; display: block; }
        .price-item small { color: #666; }
        .divider { width: 1px; height: 50px; background: #333; }

        .time-card { background: #1e1e1e; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: center; border: 1px solid #333; }
        .time-block { text-align: center; margin-bottom: 10px; }
        .time-block:last-child { margin-bottom: 0; }
        .time-block span { display: block; color: #aaa; font-size: 0.8rem; }
        .time-block strong { font-size: 1.2rem; color: #fff; }

        /* Activities */
        .activities-section { margin-bottom: 25px; }
        .activity-box { background: #1e1e1e; padding: 20px; border-radius: 16px; margin-bottom: 15px; border-left: 4px solid var(--primary); }
        .activity-box.free { border-left-color: #4ade80; }
        .activity-box h4 { margin: 0 0 10px 0; color: #fff; }
        .activity-box p { margin: 0; color: #bbb; line-height: 1.6; }

        /* Booking Card */
        .booking-card-large { background: linear-gradient(145deg, #1e1e1e, #252525); padding: 25px; border-radius: 20px; border: 1px solid #444; margin-bottom: 25px; }
        .booking-card-large h3 { margin: 0 0 20px 0; text-align: center; font-size: 1.4rem; }

        .booking-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .input-group label { display: block; color: #aaa; margin-bottom: 8px; font-size: 0.9rem; }
        .input-group input { width: 100%; padding: 14px; border-radius: 10px; background: #121212; border: 1px solid #444; color: #fff; font-size: 1rem; }

        .guests-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .counter-box label { display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 5px; }
        .counter-box input { width: 100%; padding: 10px; border-radius: 8px; background: #121212; border: 1px solid #444; color: #fff; text-align: center; }
        .badge-free { color: #4ade80; font-weight: bold; }
        .badge-half { color: #fbbf24; font-weight: bold; }

        .whatsapp-btn-large {
          width: 100%; padding: 18px; background: #25D366; color: white;
          border: none; border-radius: 12px; font-size: 1.2rem; font-weight: bold;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px; transition: transform 0.1s;
        }
        .whatsapp-btn-large:active { transform: scale(0.98); }
        .whatsapp-btn-large .icon { margin-right: 10px; font-size: 1.5rem; }
        .terms { text-align: center; font-size: 0.8rem; color: #777; margin: 0; }

        /* Reviews */
        .reviews-section { margin-top: 40px; }
        .review-card { background: #1e1e1e; padding: 20px; border-radius: 12px; margin-bottom: 15px; }
        .review-head { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .stars { font-size: 0.9rem; }
        .load-more-btn { width: 100%; padding: 12px; background: transparent; border: 1px solid #444; color: #aaa; border-radius: 8px; cursor: pointer; }

        .review-form { margin-top: 30px; border-top: 1px solid #333; padding-top: 30px; }
        .review-form h4 { margin-bottom: 15px; }
        .form-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .form-row input, .form-row select { flex: 1; background: #1e1e1e; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px; }
        .review-form textarea { width: 100%; background: #1e1e1e; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-sizing: border-box; }
        .submit-btn { width: 100%; padding: 12px; background: var(--primary); color: #000; border: none; border-radius: 8px; font-weight: bold; }

        /* Lightbox */
        .lightbox-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
        .lightbox-img { max-width: 95%; max-height: 95%; object-fit: contain; border-radius: 10px; }
        .lightbox-close { position: absolute; top: 20px; right: 30px; color: white; font-size: 40px; background: none; border: none; cursor: pointer; }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .pricing-section { grid-template-columns: 1fr; }
          .main-image-wrap { height: 250px; }
          .resort-header-large h2 { font-size: 1.5rem; }
          .quick-info-bar { flex-direction: column; gap: 5px; }
          .guests-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
};

export default ResortModal;