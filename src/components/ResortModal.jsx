import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ResortModal = ({ resort, onClose, onUpdate }) => {
  // --- State ---
  const [activeImage, setActiveImage] = useState(resort.images?.[0] || '');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [newReview, setNewReview] = useState({ user_name: '', rating: 5, text: '' });
  
  // Booking State
  const [booking, setBooking] = useState({
    checkIn: '',
    checkOut: '',
    adults: 1,
    children1to5: 0, // Free
    children6to11: 0, // Half Price
    roomType: 'sharing' // sharing or couple
  });

  // --- Effects ---
  
  // Handle Mobile Back Button
  useEffect(() => {
    // Push state to history so back button works
    window.history.pushState({ modalOpen: true }, '');
    window.addEventListener('popstate', onClose);
    
    return () => {
      window.removeEventListener('popstate', onClose);
    };
  }, [onClose]);

  // --- Logic ---

  // Calculate Total Price
  const calculatePrice = () => {
    const priceBase = booking.roomType === 'couple' 
      ? (resort.price_couple || 0) 
      : (resort.price_sharing || 0);

    const adultCost = booking.adults * priceBase;
    // Children 1-5 are Free
    const child6to11Cost = booking.children6to11 * (priceBase * 0.5); // 50% price

    return adultCost + child6to11Cost;
  };

  // WhatsApp Booking Logic
  const handleWhatsAppBooking = () => {
    const phoneNumber = '919359431179'; // Your number with country code
    const total = calculatePrice();
    
    const message = `
*New Booking Inquiry* 🏖️
---------------------------
*Resort:* ${resort.name}
*Room Type:* ${booking.roomType.toUpperCase()}
*Check-in:* ${booking.checkIn}
*Check-out:* ${booking.checkOut}
---------------------------
*Guests:*
Adults: ${booking.adults}
Children (1-5 yrs): ${booking.children1to5} (Free)
Children (6-11 yrs): ${booking.children6to11}
---------------------------
*Estimated Total:* ₹${total.toFixed(0)}
---------------------------
Please send me more details.
    `.trim();

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if(!newReview.user_name || !newReview.text) return;

    const reviewData = {
      resort_id: resort.id,
      ...newReview,
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select();

    if (error) {
      alert("Failed to post review: " + error.message);
      return;
    }

    const updatedResort = {
      ...resort,
      reviews: [...(resort.reviews || []), data[0]]
    };
    
    onUpdate(updatedResort);
    setNewReview({ user_name: '', rating: 5, text: '' });
  };

  const visibleReviews = showAllReviews ? resort.reviews : resort.reviews?.slice(0, 3);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>&times;</button>

        {/* --- GALLERY SECTION --- */}
        <div className="modal-gallery">
          <div className="main-image-container">
            <img src={activeImage} alt={resort.name} />
            <div className="badge-type">{resort.type}</div>
          </div>
          
          {resort.images?.length > 1 && (
            <div className="thumbnail-list">
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
        </div>

        {/* --- BODY SECTION --- */}
        <div className="modal-body-modern">
          
          {/* Header */}
          <div className="resort-header">
            <h2>{resort.name}</h2>
            <p className="location">📍 {resort.location}</p>
            <div className="distances">
              {resort.distance_dandeli && <span>🚗 {resort.distance_dandeli} from Dandeli</span>}
              {resort.distance_hub && <span>📍 {resort.distance_hub} from Hub</span>}
            </div>
          </div>

          {/* Details Grid */}
          <div className="info-grid">
            <div className="info-card">
              <h4>💵 Pricing</h4>
              <p>Sharing: ₹{resort.price_sharing || 'N/A'}/person</p>
              <p>Couple: ₹{resort.price_couple || 'N/A'}/person</p>
              <p className="highlight">Water Activity: ₹{resort.price_water_activity || 600}</p>
            </div>
            <div className="info-card">
              <h4>⏰ Timings</h4>
              <p>Check-in: <strong>{resort.check_in_time || '12:00 PM'}</strong></p>
              <p>Check-out: <strong>{resort.check_out_time || '11:00 AM'}</strong></p>
            </div>
          </div>

          {/* Activities */}
          <div className="section-block">
            <h3>🌊 Water Activities (Paid)</h3>
            <p className="text-muted">{resort.water_activities || 'Rafting, Boating, Kayaking, Zipline'}</p>
          </div>

          <div className="section-block">
            <h3>🎁 Included Activities (Free)</h3>
            <p className="text-muted">{resort.activities_included || 'Campfire, Music, Indoor Games'}</p>
          </div>

          {/* --- BOOKING SECTION --- */}
          <div className="booking-card">
            <h3>📅 Check Availability & Book</h3>
            
            <div className="booking-grid">
              <div className="input-group">
                <label>Check-in</label>
                <input type="date" value={booking.checkIn} onChange={e => setBooking({...booking, checkIn: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Check-out</label>
                <input type="date" value={booking.checkOut} onChange={e => setBooking({...booking, checkOut: e.target.value})} />
              </div>
            </div>

            <div className="room-select">
              <label>Room Type</label>
              <select value={booking.roomType} onChange={e => setBooking({...booking, roomType: e.target.value})}>
                <option value="sharing">Sharing Room</option>
                <option value="couple">Couple Room</option>
              </select>
            </div>

            <div className="guests-counter">
              <div className="counter-item">
                <label>Adults</label>
                <input type="number" min="1" value={booking.adults} onChange={e => setBooking({...booking, adults: Number(e.target.value)})} />
              </div>
              <div className="counter-item">
                <label>Kids (1-5) <span style={{fontSize:'0.7rem', color:'green'}}>FREE</span></label>
                <input type="number" min="0" value={booking.children1to5} onChange={e => setBooking({...booking, children1to5: Number(e.target.value)})} />
              </div>
              <div className="counter-item">
                <label>Kids (6-11) <span style={{fontSize:'0.7rem', color:'orange'}}>50%</span></label>
                <input type="number" min="0" value={booking.children6to11} onChange={e => setBooking({...booking, children6to11: Number(e.target.value)})} />
              </div>
            </div>

            <div className="price-summary">
              <h4>Estimated Total: ₹{calculatePrice().toFixed(0)}</h4>
              <p style={{fontSize: '0.8rem', color: '#aaa'}}>Children 1-5 yrs are complimentary. 6-11 yrs are half price.</p>
            </div>

            <button className="whatsapp-btn" onClick={handleWhatsAppBooking}>
              <span style={{marginRight: '10px', fontSize: '1.2rem'}}>📱</span> Book via WhatsApp
            </button>
            
            <div className="cancellation-note">
              <p><strong>Cancellation Policy:</strong> Cancellations at the last moment may incur charges. Please confirm with the resort.</p>
            </div>
          </div>

          {/* --- REVIEWS SECTION --- */}
          <div className="reviews-container">
            <h3>🗣️ Guest Reviews ({resort.reviews?.length || 0})</h3>
            
            {resort.reviews?.length > 0 ? (
              <>
                {visibleReviews.map(rev => (
                  <div key={rev.id} className="review-item">
                    <div className="review-head">
                      <strong>{rev.user_name}</strong>
                      <span>{'⭐'.repeat(rev.rating)}</span>
                    </div>
                    <p>{rev.text}</p>
                  </div>
                ))}
                {resort.reviews.length > 3 && (
                  <button className="load-more" onClick={() => setShowAllReviews(!showAllReviews)}>
                    {showAllReviews ? 'Show Less' : 'Read All Reviews'}
                  </button>
                )}
              </>
            ) : <p className="no-reviews">No reviews yet.</p>}

            <form className="review-form" onSubmit={handleReviewSubmit}>
              <h4>Write a Review</h4>
              <div className="form-row">
                <input placeholder="Name" value={newReview.user_name} onChange={e => setNewReview({...newReview, user_name: e.target.value})} required />
                <select value={newReview.rating} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}>
                  <option value="5">⭐⭐⭐⭐⭐</option>
                  <option value="4">⭐⭐⭐⭐</option>
                  <option value="3">⭐⭐⭐</option>
                </select>
              </div>
              <textarea placeholder="Share experience..." value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} required></textarea>
              <button type="submit" className="submit-review-btn">Submit</button>
            </form>
          </div>

        </div>
      </div>

      {/* --- CSS STYLES --- */}
      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 10px; overflow-y: auto;
        }
        .modal-content-modern {
          background: #121212; width: 100%; max-width: 600px;
          border-radius: 20px; overflow: hidden; position: relative;
          max-height: 90vh; overflow-y: auto; color: #fff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .modal-close-btn {
          position: absolute; top: 15px; right: 15px; z-index: 10;
          background: rgba(0,0,0,0.5); border: none; color: white;
          width: 35px; height: 35px; border-radius: 50%;
          font-size: 20px; cursor: pointer;
        }
        
        /* Gallery */
        .modal-gallery { background: #000; }
        .main-image-container { position: relative; height: 300px; width: 100%; }
        .main-image-container img { width: 100%; height: 100%; object-fit: cover; }
        .badge-type { position: absolute; bottom: 10px; left: 10px; background: var(--primary); color: #000; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
        .thumbnail-list { display: flex; gap: 5px; padding: 10px; overflow-x: auto; background: #111; }
        .thumbnail-list img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; opacity: 0.6; cursor: pointer; border: 2px solid transparent; }
        .thumbnail-list img.active { opacity: 1; border-color: var(--primary); }

        /* Body */
        .modal-body-modern { padding: 20px; }
        .resort-header { margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px; }
        .resort-header h2 { margin: 0 0 5px 0; }
        .location { color: #aaa; margin: 0; }
        .distances { display: flex; gap: 10px; margin-top: 10px; font-size: 0.85rem; color: #ccc; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-card { background: #1e1e1e; padding: 15px; border-radius: 12px; }
        .info-card h4 { margin: 0 0 10px 0; color: var(--primary); font-size: 1rem; }
        .info-card p { margin: 3px 0; font-size: 0.9rem; color: #ccc; }
        .highlight { color: #4ade80 !important; font-weight: bold; }

        .section-block { margin-bottom: 20px; }
        .section-block h3 { font-size: 1.1rem; color: #fff; margin-bottom: 8px; }
        .text-muted { color: #bbb; margin: 0; line-height: 1.5; }

        /* Booking Card */
        .booking-card { background: #1e1e1e; border-radius: 16px; padding: 20px; margin-top: 20px; border: 1px solid #333; }
        .booking-card h3 { margin-top: 0; color: #fff; margin-bottom: 20px; text-align: center; }
        .booking-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .input-group { display: flex; flex-direction: column; }
        .input-group label { font-size: 0.8rem; color: #aaa; margin-bottom: 5px; }
        .input-group input, .room-select select {
          background: #121212; border: 1px solid #444; color: #fff;
          padding: 12px; border-radius: 8px; font-size: 1rem;
        }
        .room-select { margin-top: 15px; }
        .guests-counter { display: flex; gap: 10px; margin-top: 15px; }
        .counter-item { flex: 1; text-align: center; }
        .counter-item label { display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 5px; }
        .counter-item input { width: 100%; text-align: center; background: #121212; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 8px; }

        .price-summary { text-align: center; margin: 20px 0; padding: 15px; background: #000; border-radius: 10px; }
        .price-summary h4 { margin: 0; color: #fff; font-size: 1.4rem; }

        .whatsapp-btn {
          width: 100%; padding: 15px; background: #25D366; color: white;
          border: none; border-radius: 12px; font-size: 1.1rem; font-weight: bold;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          margin-bottom: 15px;
        }
        .cancellation-note { background: #2a2a2a; padding: 10px; border-radius: 8px; font-size: 0.8rem; color: #aaa; text-align: center; }

        /* Reviews */
        .reviews-container { margin-top: 30px; }
        .review-item { background: #1e1e1e; padding: 15px; border-radius: 10px; margin-bottom: 10px; }
        .review-head { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .load-more { width: 100%; padding: 10px; background: transparent; border: 1px solid #444; color: #aaa; border-radius: 8px; cursor: pointer; margin: 10px 0; }
        
        .review-form { margin-top: 20px; border-top: 1px solid #333; padding-top: 20px; }
        .form-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .form-row input, .form-row select { flex: 1; background: #1e1e1e; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px; }
        .review-form textarea { width: 100%; background: #1e1e1e; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
        .submit-review-btn { width: 100%; padding: 10px; background: var(--primary); color: #000; border: none; border-radius: 6px; font-weight: bold; }
        
        /* Scrollbar */
        .modal-content-modern::-webkit-scrollbar { width: 5px; }
        .modal-content-modern::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ResortModal;