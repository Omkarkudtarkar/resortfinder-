import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const PHONE_NUMBER = '919353431179';

const formatPriceWithPP = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).trim();
  if (!text) return '';
  if (/(\bpp\b|per\s*person)/i.test(text)) return text;
  if (/^[0-9]+(?:\.[0-9]+)?$/.test(text)) return `\u20B9${text} PP`;
  return `${text} PP`;
};

const getText = (value) => String(value ?? '').trim();
const hasText = (value) => Boolean(getText(value));

const getActivityLines = (value) =>
  String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const ResortDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resortId } = useParams();
  const [resort, setResort] = useState(location.state?.resort || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [newReview, setNewReview] = useState({ user_name: '', rating: 5, text: '' });
  const [booking, setBooking] = useState({
    checkIn: '',
    checkOut: '',
    adults: '',
    children6to11: '',
  });
  const reviewsRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const fetchResort = async () => {
      try {
        setLoading(true);
        setError('');
        const { data, error: fetchError } = await supabase
          .from('resorts')
          .select('*, reviews(*)')
          .eq('id', resortId)
          .maybeSingle();

        if (!mounted) return;
        if (fetchError) throw fetchError;

        if (!data) {
          setResort(null);
          setError('Resort not found.');
          return;
        }

        setResort(data);
      } catch (fetchError) {
        if (!mounted) return;
        console.error('Error loading resort details:', fetchError.message);
        setError('Unable to load resort details right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchResort();

    return () => {
      mounted = false;
    };
  }, [resortId]);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsImageOpen(false);
  }, [resortId]);

  const images = useMemo(() => {
    if (!Array.isArray(resort?.images)) return [];
    return resort.images.filter(Boolean);
  }, [resort]);

  const sortedReviews = useMemo(() => {
    const list = [...(resort?.reviews || [])];
    list.sort((a, b) => {
      const aTime = new Date(a.created_at || a.date || 0).getTime();
      const bTime = new Date(b.created_at || b.date || 0).getTime();
      return bTime - aTime;
    });
    return list;
  }, [resort]);

  const averageRating = useMemo(() => {
    if (!sortedReviews.length) return 0;
    const total = sortedReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return total / sortedReviews.length;
  }, [sortedReviews]);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(-1);
      return;
    }
    navigate('/category/budget');
  };

  const handleNextImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const normalizeGuestCount = (rawValue, minValue) => {
    if (rawValue === '') return '';
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return String(Math.max(minValue, Number(digitsOnly)));
  };

  const handleWhatsAppBooking = () => {
    if (!resort) return;

    const message = [
      'Resort Inquiry',
      '---------------------------',
      `Resort: ${resort.name}`,
      `Check-in: ${booking.checkIn || 'Not selected'}`,
      `Check-out: ${booking.checkOut || 'Not selected'}`,
      '---------------------------',
      'Guests:',
      `Adults: ${booking.adults || 'Not specified'}`,
      `Children (6-11 yrs): ${booking.children6to11 || 'Not specified'}`,
      '---------------------------',
      'Please send me more details for this stay.',
    ].join('\n');

    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!resort) return;
    if (!newReview.user_name.trim() || !newReview.text.trim()) return;

    const reviewData = {
      resort_id: resort.id,
      ...newReview,
    };

    const { data, error: insertError } = await supabase.from('reviews').insert([reviewData]).select();

    if (insertError) {
      alert(`Failed to post review: ${insertError.message}`);
      return;
    }

    const insertedReview = data?.[0];
    if (insertedReview) {
      setResort((current) => ({
        ...current,
        reviews: [...(current?.reviews || []), insertedReview],
      }));
    }
    setNewReview({ user_name: '', rating: 5, text: '' });
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="resort-page resort-state">
        <button type="button" className="resort-back-btn" onClick={handleBack}>
          {'<'} Back to Resorts
        </button>
        <div className="landing-loading-spinner" aria-label="Loading resort details" />
      </div>
    );
  }

  if (error || !resort) {
    return (
      <div className="resort-page resort-state">
        <button type="button" className="resort-back-btn" onClick={handleBack}>
          {'<'} Back to Resorts
        </button>
        <div className="resort-error">
          <h2>Resort details unavailable</h2>
          <p>{error || 'This resort could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const currentImage = images[activeImageIndex];
  const distanceDandeli = getText(resort.distance_dandeli);
  const waterActivityDistance = getText(resort.water_activity_distance);
  const sharingPrice = formatPriceWithPP(resort.price_sharing || resort.price);
  const couplePrice = formatPriceWithPP(resort.price_couple);
  const checkInTime = getText(resort.check_in_time);
  const checkOutTime = getText(resort.check_out_time);
  const waterActivities = getActivityLines(resort.water_activities_included);
  const resortActivities = getActivityLines(resort.activities_included);
  const paidActivities = getActivityLines(resort.paid_activities);

  return (
    <div className="resort-page">
      <header className="resort-header">
        <button type="button" className="resort-back-btn" onClick={handleBack}>
          {'<'} Back to Resorts
        </button>
      </header>

      <main className="resort-layout">
        {images.length > 0 && (
          <section className="resort-gallery-card">
            <div className="resort-hero-image-wrap">
              <img
                src={currentImage}
                alt={resort.name}
                className="resort-hero-image"
                onClick={() => setIsImageOpen(true)}
              />
              {images.length > 1 && (
                <>
                  <button type="button" className="resort-gallery-nav prev" onClick={handlePrevImage}>
                    {'<'}
                  </button>
                  <button type="button" className="resort-gallery-nav next" onClick={handleNextImage}>
                    {'>'}
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="resort-thumbnails">
                {images.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    className={`resort-thumb ${index === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={imageUrl} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="resort-content">
          <article className="resort-info-card">
            <h1>{resort.name}</h1>
            {hasText(resort.location) && <p className="resort-location">Location: {resort.location}</p>}
            {hasText(resort.description) && <p className="resort-description">{resort.description}</p>}
          </article>

          {(distanceDandeli || waterActivityDistance) && (
            <article className="resort-info-card">
              <h3>Distance Details</h3>
              {distanceDandeli && (
                <p>
                  <span>Distance from Dandeli Bus Stand:</span> {distanceDandeli}
                </p>
              )}
              {waterActivityDistance && (
                <p>
                  <span>Water % Rope Activities Distance:</span> {waterActivityDistance}
                </p>
              )}
            </article>
          )}

          <article className="resort-info-card resort-food-card">
            <h3>Food Information</h3>
            <p className="resort-food-text">Breakfast, Lunch, Dinner Included</p>
          </article>

          {(sharingPrice || couplePrice) && (
            <article className="resort-info-card">
              <h3>Package Price</h3>
              {sharingPrice && <p>Sharing: {sharingPrice}</p>}
              {couplePrice && <p>Couple: {couplePrice}</p>}
            </article>
          )}

          {(checkInTime || checkOutTime) && (
            <article className="resort-info-card">
              <h3>Timings</h3>
              {checkInTime && <p>Check-in: {checkInTime}</p>}
              {checkOutTime && <p>Check-out: {checkOutTime}</p>}
            </article>
          )}

          {waterActivities.length > 0 && (
            <article className="resort-info-card">
              <h3>Water Activities Included</h3>
              <ul>
                {waterActivities.map((activity, index) => (
                  <li key={`${activity}-${index}`}>{activity}</li>
                ))}
              </ul>
            </article>
          )}

          {resortActivities.length > 0 && (
            <article className="resort-info-card">
              <h3>Resort Activities Included</h3>
              <ul>
                {resortActivities.map((activity, index) => (
                  <li key={`${activity}-${index}`}>{activity}</li>
                ))}
              </ul>
            </article>
          )}4

          {paidActivities.length > 0 && (
            <article className="resort-info-card">
              <h3>Paid Activities</h3>
              <ul>
                {paidActivities.map((activity, index) => (
                  <li key={`${activity}-${index}`}>{activity}</li>
                ))}
              </ul>
            </article>
          )}

          <article className="resort-info-card">
            <h3>Book Your Stay</h3>
            <div className="resort-booking-grid">
              <label>
                <span>Check-in date</span>
                <input
                  type="date"
                  value={booking.checkIn}
                  onChange={(event) => setBooking((prev) => ({ ...prev, checkIn: event.target.value }))}
                />
              </label>
              <label>
                <span>Check-out date</span>
                <input
                  type="date"
                  min={booking.checkIn || undefined}
                  value={booking.checkOut}
                  onChange={(event) => setBooking((prev) => ({ ...prev, checkOut: event.target.value }))}
                />
              </label>
              <label>
                <span>Adults</span>
                <input
                  type="number"
                  min="1"
                  value={booking.adults}
                  onChange={(event) =>
                    setBooking((prev) => ({
                      ...prev,
                      adults: normalizeGuestCount(event.target.value, 1),
                    }))
                  }
                />
              </label>
              <label>
                <span>Kids (6-11 years)</span>
                <input
                  type="number"
                  min="0"
                  value={booking.children6to11}
                  onChange={(event) =>
                    setBooking((prev) => ({
                      ...prev,
                      children6to11: normalizeGuestCount(event.target.value, 0),
                    }))
                  }
                />
              </label>
            </div>
            <button type="button" className="resort-whatsapp-btn" onClick={handleWhatsAppBooking}>
              Continue on WhatsApp
            </button>
          </article>

          <article className="resort-info-card" ref={reviewsRef}>
            <h3>
              Guest Reviews ({sortedReviews.length}) | Rating: {averageRating ? averageRating.toFixed(1) : '0.0'}
            </h3>
            {sortedReviews.length ? (
              <div className="resort-review-list">
                {sortedReviews.map((review) => (
                  <div key={review.id} className="resort-review-item">
                    <div className="resort-review-head">
                      <strong>{review.user_name}</strong>
                      <span>{new Date(review.created_at || review.date).toLocaleDateString()}</span>
                    </div>
                    <p className="resort-review-rating">{'*'.repeat(Number(review.rating) || 0)}</p>
                    <p>{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No reviews yet. Be the first to post one.</p>
            )}

            <form className="resort-review-form" onSubmit={handleReviewSubmit}>
              <h4>Leave a Review</h4>
              <div className="resort-review-input-row">
                <input
                  placeholder="Your Name"
                  value={newReview.user_name}
                  onChange={(event) => setNewReview((prev) => ({ ...prev, user_name: event.target.value }))}
                  required
                />
                <select
                  value={newReview.rating}
                  onChange={(event) => setNewReview((prev) => ({ ...prev, rating: Number(event.target.value) }))}
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
              <button type="submit">Submit Review</button>
            </form>
          </article>
        </section>
      </main>

      {isImageOpen && currentImage && (
        <div className="resort-lightbox" onClick={() => setIsImageOpen(false)}>
          <div className="resort-lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="resort-lightbox-close"
              onClick={() => setIsImageOpen(false)}
              aria-label="Close image preview"
            >
              x
            </button>
            <img src={currentImage} alt={`${resort.name} preview`} className="resort-lightbox-image" />
          </div>
        </div>
      )}

      <style>{`
        .resort-page {
          min-height: 100svh;
          color: #e6eef7;
          background:
            linear-gradient(170deg, rgba(2, 12, 22, 0.7), rgba(5, 22, 36, 0.72)),
            url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1500&q=80') center/cover fixed;
          padding-bottom: 42px;
        }

        .resort-state {
          display: grid;
          place-content: center;
          gap: 22px;
          justify-items: center;
          padding: 24px;
        }

        .resort-header {
          position: sticky;
          top: 0;
          z-index: 30;
          padding: 14px 16px;
          background: rgba(4, 14, 24, 0.8);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .resort-back-btn {
          border: 1px solid rgba(31, 191, 143, 0.45);
          background: rgba(31, 191, 143, 0.12);
          color: #cdf9eb;
          border-radius: 999px;
          padding: 9px 15px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
        }

        .resort-layout {
          max-width: 1100px;
          margin: 0 auto;
          padding: 14px;
          display: grid;
          gap: 14px;
        }

        .resort-gallery-card {
          background: #0d2134;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 18px 32px rgba(0, 0, 0, 0.25);
        }

        .resort-hero-image-wrap {
          position: relative;
          height: clamp(240px, 48vw, 480px);
          background: #060f17;
        }

        .resort-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: zoom-in;
        }

        .resort-gallery-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 999px;
          background: rgba(8, 16, 24, 0.65);
          color: #f8fffc;
          font-size: 1.1rem;
          cursor: pointer;
          border: none;
        }

        .resort-gallery-nav.prev {
          left: 12px;
        }

        .resort-gallery-nav.next {
          right: 12px;
        }

        .resort-thumbnails {
          display: flex;
          gap: 8px;
          padding: 10px;
          overflow-x: auto;
          background: #0b1622;
        }

        .resort-thumb {
          min-width: 66px;
          height: 52px;
          border-radius: 10px;
          border: 2px solid transparent;
          overflow: hidden;
          padding: 0;
          opacity: 0.55;
          background: transparent;
          cursor: pointer;
        }

        .resort-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .resort-thumb.active {
          opacity: 1;
          border-color: #1fbf8f;
        }

        .resort-content {
          display: grid;
          gap: 12px;
        }

        .resort-info-card {
          background: #0d2134;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
        }

        .resort-info-card h1,
        .resort-info-card h3,
        .resort-info-card h4,
        .resort-info-card p {
          margin-top: 0;
        }

        .resort-location {
          color: #9fb4c8;
          margin-bottom: 10px;
        }

        .resort-description {
          line-height: 1.55;
          color: #c7d3df;
          margin-bottom: 0;
        }

        .resort-highlight-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .resort-highlight-grid p {
          margin: 8px 0 0;
          color: #c8d9ea;
        }

        .resort-highlight-grid p span {
          color: #8ce9cb;
          font-weight: 700;
        }

        .resort-food-card {
          border-color: rgba(255, 255, 255, 0.1);
          background: #0d2134;
        }

        .resort-food-text {
          color: #e6eef7;
          font-size: 1.05rem;
          font-weight: 700;
        }

        .resort-info-card ul {
          margin: 8px 0 0;
          padding-left: 18px;
          color: #c8d9ea;
        }

        .resort-booking-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .resort-booking-grid label {
          display: grid;
          gap: 6px;
          color: #a9bed3;
          font-size: 0.9rem;
        }

        .resort-booking-grid input,
        .resort-review-form input,
        .resort-review-form select,
        .resort-review-form textarea {
          background: #091725;
          border: 1px solid #2b435c;
          border-radius: 10px;
          color: #e8f2fc;
          min-height: 42px;
          padding: 10px;
          font-size: 0.95rem;
        }

        .resort-whatsapp-btn {
          margin-top: 12px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #25d366, #1aaf54);
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          min-height: 44px;
          width: 100%;
          cursor: pointer;
        }

        .resort-review-list {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }

        .resort-review-item {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          background: #0a1a2a;
          padding: 12px;
        }

        .resort-review-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: #aac0d6;
          font-size: 0.84rem;
        }

        .resort-review-rating {
          margin: 8px 0 6px;
          color: #ffd76c;
          letter-spacing: 0.08em;
        }

        .resort-review-form {
          margin-top: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px;
          display: grid;
          gap: 10px;
          background: #0a1a2a;
        }

        .resort-review-form h4 {
          margin: 0;
        }

        .resort-review-input-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 130px;
          gap: 10px;
        }

        .resort-review-form textarea {
          min-height: 90px;
          resize: vertical;
        }

        .resort-review-form button {
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #22bf8f, #168d69);
          color: #fff;
          min-height: 42px;
          font-weight: 700;
          cursor: pointer;
        }

        .resort-error {
          text-align: center;
        }

        .resort-error h2 {
          margin: 0 0 8px;
        }

        .resort-error p {
          margin: 0;
          color: #c7d3df;
        }

        .resort-lightbox {
          position: fixed;
          inset: 0;
          z-index: 3000;
          background: rgba(0, 0, 0, 0.82);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .resort-lightbox-content {
          position: relative;
          width: min(1100px, 100%);
          max-height: 92svh;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: #050b13;
        }

        .resort-lightbox-image {
          width: 100%;
          height: 100%;
          max-height: 92svh;
          object-fit: contain;
          display: block;
        }

        .resort-lightbox-close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(0, 0, 0, 0.45);
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 860px) {
          .resort-highlight-grid,
          .resort-booking-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .resort-layout {
            padding: 10px;
          }

          .resort-header {
            padding: 10px 12px;
          }

          .resort-review-input-row {
            grid-template-columns: 1fr;
          }

          .resort-gallery-nav {
            width: 34px;
            height: 34px;
          }
        }
      `}</style>
    </div>
  );
};

export default ResortDetailsPage;
