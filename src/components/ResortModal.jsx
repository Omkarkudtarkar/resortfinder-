import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/1200x800?text=Resort+Image';
const PHONE_NUMBER = '919353431179';

const ResortModal = ({ resort, onClose, onUpdate }) => {
  const images = useMemo(
    () => (resort.images && resort.images.length > 0 ? resort.images : [PLACEHOLDER_IMAGE]),
    [resort.images]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [newReview, setNewReview] = useState({ user_name: '', rating: 5, text: '' });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [booking, setBooking] = useState({
    checkIn: '',
    checkOut: '',
    adults: 2,
    children6to11: 0,
  });
  const [drag, setDrag] = useState({ isDragging: false, startX: 0, offsetX: 0 });

  const reviewsSectionRef = useRef(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    window.history.pushState({ modalOpen: true }, '');
    window.addEventListener('popstate', onClose);
    return () => window.removeEventListener('popstate', onClose);
  }, [onClose]);

  const sortedReviews = useMemo(() => {
    const list = [...(resort.reviews || [])];
    list.sort((a, b) => {
      const aTime = new Date(a.created_at || a.date || 0).getTime();
      const bTime = new Date(b.created_at || b.date || 0).getTime();
      return bTime - aTime;
    });
    return list;
  }, [resort.reviews]);

  const reviewsToRender = showAllReviews ? sortedReviews : sortedReviews.slice(0, 3);

  const averageRating = useMemo(() => {
    if (!sortedReviews.length) return 0;
    const total = sortedReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return total / sortedReviews.length;
  }, [sortedReviews]);

  const roundedRating = Math.round(averageRating);

  const goToIndex = (index) => {
    const lastIndex = images.length - 1;
    if (index < 0) {
      setActiveIndex(lastIndex);
      return;
    }
    if (index > lastIndex) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex(index);
  };

  const goToPrevImage = () => goToIndex(activeIndex - 1);
  const goToNextImage = () => goToIndex(activeIndex + 1);

  const startDrag = (x) => {
    didDragRef.current = false;
    setDrag({ isDragging: true, startX: x, offsetX: 0 });
  };

  const moveDrag = (x) => {
    setDrag((prev) => {
      if (!prev.isDragging) return prev;
      const offsetX = x - prev.startX;
      if (Math.abs(offsetX) > 6) {
        didDragRef.current = true;
      }
      return { ...prev, offsetX };
    });
  };

  const endDrag = () => {
    setDrag((prev) => {
      if (!prev.isDragging) return prev;
      if (prev.offsetX > 70) {
        goToPrevImage();
      } else if (prev.offsetX < -70) {
        goToNextImage();
      }
      return { isDragging: false, startX: 0, offsetX: 0 };
    });
  };

  const trackStyle = {
    transform: `translateX(calc(${-activeIndex * 100}% + ${drag.offsetX}px))`,
    transition: drag.isDragging ? 'none' : 'transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1)',
  };

  const handleWhatsAppBooking = () => {
    const message = [
      'Resort Inquiry',
      '---------------------------',
      `Resort: ${resort.name}`,
      `Check-in: ${booking.checkIn || 'Not selected'}`,
      `Check-out: ${booking.checkOut || 'Not selected'}`,
      '---------------------------',
      'Guests:',
      `Adults: ${booking.adults}`,
      `Children (6-11 yrs): ${booking.children6to11}`,
      '---------------------------',
      'Please send me more details for this stay.',
    ].join('\n');

    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!newReview.user_name.trim() || !newReview.text.trim()) return;

    const reviewData = { resort_id: resort.id, ...newReview };
    const { data, error } = await supabase.from('reviews').insert([reviewData]).select();

    if (error) {
      alert(`Failed to post review: ${error.message}`);
      return;
    }

    onUpdate({ ...resort, reviews: [...(resort.reviews || []), data[0]] });
    setShowAllReviews(true);
    setNewReview({ user_name: '', rating: 5, text: '' });
  };

  const scrollToReviews = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentImage = images[activeIndex] || PLACEHOLDER_IMAGE;

  return (
    <>
      <div className="rm-overlay" onClick={onClose}>
        <div className="rm-modal" onClick={(event) => event.stopPropagation()}>
          <button className="rm-close" onClick={onClose} type="button" aria-label="Close details">
            x
          </button>

          <section className="rm-gallery-section">
            <div
              className="rm-gallery-viewport"
              onMouseDown={(event) => startDrag(event.clientX)}
              onMouseMove={(event) => moveDrag(event.clientX)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={(event) => startDrag(event.touches[0].clientX)}
              onTouchMove={(event) => moveDrag(event.touches[0].clientX)}
              onTouchEnd={endDrag}
              onClick={() => {
                if (!didDragRef.current) {
                  setIsLightboxOpen(true);
                }
              }}
            >
              <div className="rm-gallery-track" style={trackStyle}>
                {images.map((imageUrl, index) => (
                  <div className="rm-gallery-slide" key={`${imageUrl}-${index}`}>
                    <img src={imageUrl} alt={`${resort.name} ${index + 1}`} />
                  </div>
                ))}
              </div>

              <button className="rm-gallery-nav prev" onClick={goToPrevImage} type="button" aria-label="Previous image">
                {'<'}
              </button>
              <button className="rm-gallery-nav next" onClick={goToNextImage} type="button" aria-label="Next image">
                {'>'}
              </button>

              <div className="rm-gallery-meta">
                <span className="rm-type-badge">{resort.type}</span>
                <span className="rm-image-count">{activeIndex + 1}/{images.length}</span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="rm-thumbnails">
                {images.map((imageUrl, index) => (
                  <button
                    type="button"
                    key={`thumb-${imageUrl}-${index}`}
                    className={`rm-thumb ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => goToIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={imageUrl} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rm-body">
            <header className="rm-header">
              <div>
                <h2>{resort.name}</h2>
                <p className="rm-location">Location: {resort.location || 'Not specified'}</p>
              </div>

              <button type="button" className="rm-rating-chip" onClick={scrollToReviews}>
                <span className="rm-stars" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <span key={index} className={index <= roundedRating ? 'filled' : ''}>
                      ★
                    </span>
                  ))}
                </span>
                <span className="rm-rating-text">
                  {averageRating ? averageRating.toFixed(1) : '0.0'} ({sortedReviews.length})
                </span>
                <span className="rm-rating-hint">Tap to read reviews</span>
              </button>
            </header>

            <div className="rm-pricing-grid">
              <article className="rm-card rm-price-card">
                <h3>Package Price</h3>
                <p className="rm-subtle">Includes stay, meals, and selected activities.</p>
                <div className="rm-price-row">
                  <div>
                    <span>Sharing</span>
                    <strong>INR {resort.price_sharing || 'N/A'}</strong>
                  </div>
                  <div>
                    <span>Couple</span>
                    <strong>INR {resort.price_couple || 'N/A'}</strong>
                  </div>
                </div>
              </article>

              <article className="rm-card rm-time-card">
                <div>
                  <span>Check-in</span>
                  <strong>{resort.check_in_time || '12:00 PM'}</strong>
                </div>
                <div>
                  <span>Check-out</span>
                  <strong>{resort.check_out_time || '11:00 AM'}</strong>
                </div>
              </article>
            </div>

            <div className="rm-activity-grid">
              <article className="rm-card">
                <h4>Water Activities Included</h4>
                <p>{resort.water_activities_included || 'Ask the host for included water activities.'}</p>
              </article>
              <article className="rm-card">
                <h4>Resort Activities Included</h4>
                <p>{resort.activities_included || 'Ask the host for included resort activities.'}</p>
              </article>
            </div>

            <section className="rm-booking-card">
              <h3>Book Your Stay</h3>

              <div className="rm-date-grid">
                <label className="rm-input-stack">
                  <span>Check-in date</span>
                  <input
                    type="date"
                    value={booking.checkIn}
                    onChange={(event) => setBooking((prev) => ({ ...prev, checkIn: event.target.value }))}
                  />
                </label>

                <label className="rm-input-stack">
                  <span>Check-out date</span>
                  <input
                    type="date"
                    min={booking.checkIn || undefined}
                    value={booking.checkOut}
                    onChange={(event) => setBooking((prev) => ({ ...prev, checkOut: event.target.value }))}
                  />
                </label>
              </div>

              <div className="rm-guests-grid">
                <label className="rm-input-stack">
                  <span>Adults</span>
                  <input
                    type="number"
                    min="1"
                    value={booking.adults}
                    onChange={(event) =>
                      setBooking((prev) => ({ ...prev, adults: Math.max(1, Number(event.target.value) || 1) }))
                    }
                  />
                </label>

                <label className="rm-input-stack">
                  <span>Kids (6-11 years)</span>
                  <input
                    type="number"
                    min="0"
                    value={booking.children6to11}
                    onChange={(event) =>
                      setBooking((prev) => ({ ...prev, children6to11: Math.max(0, Number(event.target.value) || 0) }))
                    }
                  />
                </label>
              </div>

              <button className="rm-book-btn" onClick={handleWhatsAppBooking} type="button">
                Continue on WhatsApp
              </button>
              <p className="rm-terms">For children pricing and custom requests, message us on WhatsApp.</p>
            </section>

            <section className="rm-reviews" ref={reviewsSectionRef}>
              <div className="rm-reviews-head">
                <h3>Guest Reviews ({sortedReviews.length})</h3>
                {sortedReviews.length > 3 && !showAllReviews && (
                  <button type="button" className="rm-view-all" onClick={() => setShowAllReviews(true)}>
                    View All Reviews
                  </button>
                )}
                {showAllReviews && sortedReviews.length > 3 && (
                  <button type="button" className="rm-view-all" onClick={() => setShowAllReviews(false)}>
                    Show Recent Only
                  </button>
                )}
              </div>

              {sortedReviews.length > 0 ? (
                <div className="rm-review-list">
                  {reviewsToRender.map((review) => (
                    <article key={review.id} className="rm-review-card">
                      <div className="rm-review-top">
                        <strong>{review.user_name}</strong>
                        <span>{new Date(review.created_at || review.date).toLocaleDateString()}</span>
                      </div>
                      <div className="rm-review-stars">{'★'.repeat(Number(review.rating) || 0)}</div>
                      <p>{review.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rm-empty">No reviews yet. Be the first to post one.</p>
              )}

              <form className="rm-review-form" onSubmit={handleReviewSubmit}>
                <h4>Leave a Review</h4>
                <div className="rm-form-row">
                  <input
                    placeholder="Your Name"
                    value={newReview.user_name}
                    onChange={(event) => setNewReview((prev) => ({ ...prev, user_name: event.target.value }))}
                    required
                  />
                  <select
                    value={newReview.rating}
                    onChange={(event) =>
                      setNewReview((prev) => ({ ...prev, rating: Number(event.target.value) }))
                    }
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <textarea
                  placeholder="Share your experience..."
                  value={newReview.text}
                  onChange={(event) => setNewReview((prev) => ({ ...prev, text: event.target.value }))}
                  required
                />
                <button type="submit" className="rm-submit">
                  Submit Review
                </button>
              </form>
            </section>
          </section>
        </div>
      </div>

      {isLightboxOpen && (
        <div className="rm-lightbox" onClick={() => setIsLightboxOpen(false)}>
          <button className="rm-lightbox-close" type="button" aria-label="Close full screen image">
            x
          </button>
          <img src={currentImage} alt="Full size" className="rm-lightbox-image" />
        </div>
      )}

      <style>{`
        .rm-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(4, 8, 14, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          animation: rmFadeIn 0.2s ease;
        }

        .rm-modal {
          width: min(940px, 100%);
          max-height: min(94svh, 940px);
          overflow-y: auto;
          scroll-behavior: smooth;
          border-radius: 24px;
          background: linear-gradient(180deg, #101a26, #0e1722);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f0f5fb;
          box-shadow: 0 26px 70px rgba(0, 0, 0, 0.45);
          position: relative;
        }

        .rm-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(9, 16, 24, 0.85);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          z-index: 12;
        }

        .rm-gallery-section {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .rm-gallery-viewport {
          position: relative;
          height: clamp(230px, 40vw, 420px);
          overflow: hidden;
          user-select: none;
          touch-action: pan-y;
          cursor: grab;
          background: #05090d;
        }

        .rm-gallery-track {
          display: flex;
          height: 100%;
          will-change: transform;
        }

        .rm-gallery-slide {
          min-width: 100%;
          height: 100%;
        }

        .rm-gallery-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rm-gallery-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 999px;
          background: rgba(8, 16, 24, 0.6);
          color: #f8fffc;
          font-size: 1.1rem;
          cursor: pointer;
          backdrop-filter: blur(3px);
          transition: background 0.2s ease;
        }

        .rm-gallery-nav:hover {
          background: rgba(24, 148, 109, 0.82);
        }

        .rm-gallery-nav.prev { left: 12px; }
        .rm-gallery-nav.next { right: 12px; }

        .rm-gallery-meta {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rm-type-badge,
        .rm-image-count {
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(6, 12, 18, 0.62);
        }

        .rm-thumbnails {
          display: flex;
          gap: 8px;
          padding: 12px;
          overflow-x: auto;
          background: #0b121a;
        }

        .rm-thumb {
          min-width: 66px;
          height: 52px;
          border-radius: 10px;
          padding: 0;
          border: 2px solid transparent;
          overflow: hidden;
          opacity: 0.55;
          background: transparent;
          cursor: pointer;
          transition: opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }

        .rm-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rm-thumb.active {
          opacity: 1;
          transform: translateY(-1px);
          border-color: #1fbf8f;
        }

        .rm-body {
          padding: 22px;
          display: grid;
          gap: 18px;
        }

        .rm-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 16px;
        }

        .rm-header h2 {
          margin: 0;
          font-size: clamp(1.35rem, 2.4vw, 2rem);
        }

        .rm-location {
          margin: 8px 0 0;
          color: #a9bccf;
        }

        .rm-rating-chip {
          border: 1px solid rgba(30, 188, 140, 0.4);
          background: rgba(30, 188, 140, 0.08);
          color: #c8f6e5;
          border-radius: 14px;
          padding: 9px 12px;
          display: grid;
          gap: 2px;
          justify-items: end;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
          min-width: 160px;
        }

        .rm-rating-chip:hover {
          transform: translateY(-1px);
          border-color: rgba(30, 188, 140, 0.7);
        }

        .rm-stars {
          display: flex;
          gap: 2px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .rm-stars span {
          color: #6f8296;
        }

        .rm-stars span.filled {
          color: #ffd76c;
        }

        .rm-rating-text {
          font-size: 0.82rem;
          color: #d6ebff;
        }

        .rm-rating-hint {
          font-size: 0.72rem;
          color: #95b6a7;
        }

        .rm-pricing-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
          gap: 12px;
        }

        .rm-card {
          background: #151f2a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
        }

        .rm-price-card h3,
        .rm-booking-card h3,
        .rm-reviews h3 {
          margin: 0;
        }

        .rm-subtle {
          margin: 7px 0 12px;
          color: #8ca2b6;
          font-size: 0.9rem;
        }

        .rm-price-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .rm-price-row span,
        .rm-time-card span {
          color: #9cb1c4;
          font-size: 0.8rem;
        }

        .rm-price-row strong,
        .rm-time-card strong {
          display: block;
          margin-top: 4px;
          font-size: 1.08rem;
        }

        .rm-time-card {
          display: grid;
          gap: 12px;
          align-content: center;
        }

        .rm-activity-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .rm-activity-grid h4 {
          margin: 0 0 8px;
          color: #dff4ff;
          font-size: 1rem;
        }

        .rm-activity-grid p {
          margin: 0;
          color: #b9cadb;
          line-height: 1.5;
        }

        .rm-booking-card {
          background: linear-gradient(145deg, rgba(20, 31, 44, 0.95), rgba(17, 27, 39, 0.95));
          border: 1px solid rgba(87, 159, 255, 0.25);
          border-radius: 18px;
          padding: 18px;
          display: grid;
          gap: 12px;
        }

        .rm-date-grid,
        .rm-guests-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .rm-input-stack {
          display: grid;
          gap: 6px;
          font-size: 0.86rem;
          color: #acc2d8;
        }

        .rm-input-stack input,
        .rm-review-form input,
        .rm-review-form select,
        .rm-review-form textarea {
          background: #0f1721;
          border: 1px solid #2f4256;
          color: #e9f4ff;
          border-radius: 10px;
          padding: 11px;
          font-size: 0.96rem;
          min-height: 44px;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .rm-input-stack input:focus,
        .rm-review-form input:focus,
        .rm-review-form select:focus,
        .rm-review-form textarea:focus {
          outline: none;
          border-color: #39cf9d;
          box-shadow: 0 0 0 3px rgba(57, 207, 157, 0.16);
        }

        .rm-book-btn {
          width: 100%;
          min-height: 46px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #25d366, #1aaf54);
          color: #fff;
          font-weight: 700;
          font-size: 0.98rem;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .rm-book-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(37, 211, 102, 0.25);
        }

        .rm-book-btn:active {
          transform: translateY(0);
        }

        .rm-terms {
          margin: 0;
          color: #89a0b5;
          font-size: 0.79rem;
        }

        .rm-reviews {
          display: grid;
          gap: 12px;
        }

        .rm-reviews-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .rm-view-all {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.04);
          color: #d7e6f5;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 0.84rem;
          cursor: pointer;
        }

        .rm-review-list {
          display: grid;
          gap: 10px;
        }

        .rm-review-card {
          background: #131d28;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 14px;
        }

        .rm-review-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          color: #9fb0c1;
          font-size: 0.83rem;
          margin-bottom: 6px;
        }

        .rm-review-stars {
          color: #ffd76c;
          letter-spacing: 0.05em;
          margin-bottom: 7px;
          font-size: 0.86rem;
        }

        .rm-review-card p {
          margin: 0;
          color: #d3dfeb;
          line-height: 1.5;
        }

        .rm-empty {
          margin: 0;
          color: #8ea5b9;
        }

        .rm-review-form {
          display: grid;
          gap: 10px;
          background: #121b26;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px;
        }

        .rm-review-form h4 {
          margin: 0;
        }

        .rm-form-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 140px;
          gap: 10px;
        }

        .rm-review-form textarea {
          resize: vertical;
          min-height: 96px;
        }

        .rm-submit {
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #22bf8f, #168d69);
          color: #fff;
          font-weight: 700;
          min-height: 42px;
          cursor: pointer;
        }

        .rm-lightbox {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(3, 7, 12, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
        }

        .rm-lightbox-image {
          max-width: 96%;
          max-height: 96%;
          object-fit: contain;
          border-radius: 12px;
        }

        .rm-lightbox-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255, 255, 255, 0.32);
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.45);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        @keyframes rmFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .rm-pricing-grid,
          .rm-activity-grid {
            grid-template-columns: 1fr;
          }

          .rm-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .rm-rating-chip {
            justify-items: start;
          }
        }

        @media (max-width: 640px) {
          .rm-overlay {
            padding: 0;
          }

          .rm-modal {
            width: 100%;
            max-height: 100svh;
            border-radius: 18px 18px 0 0;
          }

          .rm-close {
            top: 10px;
            right: 10px;
          }

          .rm-body {
            padding: 16px;
          }

          .rm-gallery-viewport {
            height: 260px;
          }

          .rm-gallery-nav {
            width: 34px;
            height: 34px;
          }

          .rm-date-grid,
          .rm-guests-grid,
          .rm-form-row {
            grid-template-columns: 1fr;
          }

          .rm-thumb {
            min-width: 58px;
            height: 46px;
          }
        }
      `}</style>
    </>
  );
};

export default ResortModal;
