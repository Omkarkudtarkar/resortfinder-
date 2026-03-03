import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

const INITIAL_FORM = {
  name: '', type: 'budget', description: '', location: '',
  price_sharing: '', price_couple: '',
  check_in_time: '', check_out_time: '',
  distance_dandeli: '', // Distance from Bus Stand
  water_activity_distance: '', // Distance of water activities
  activities_included: '',
  water_activities_included: '',
  paid_activities: '',
  images: [], details: { pricing: '', meals: '', activities: '' }
};

const AdminPanel = () => {
  // --- State Management ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resorts, setResorts] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'form', 'reviews'
  const [editingResort, setEditingResort] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // --- 1. Auth & Data Logic ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle Mobile Back Button
  useEffect(() => {
    if (!session) return;
    window.onpopstate = () => {
      if (view === 'form') {
        setView('list');
        setEditingResort(null);
        setFormData(INITIAL_FORM);
      }
    };
    return () => { window.onpopstate = null; };
  }, [session, view]);

  async function fetchResorts() {
    const { data, error } = await supabase.from('resorts').select('*, reviews(*)');
    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  }

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    fetchResorts().then((nextResorts) => {
      if (isMounted) setResorts(nextResorts);
    });
    return () => { isMounted = false; };
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ 
      email: e.target.email.value, 
      password: e.target.password.value 
    });
    if (error) alert(error.message);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('detail_')) {
      const key = name.replace('detail_', '');
      setFormData(prev => ({ ...prev, details: { ...prev.details, [key]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (formData.images.length + files.length > 15) { alert('Maximum 15 images allowed.'); return; }

    setUploading(true);
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const filePath = `public/${fileName}`;
      let { error } = await supabase.storage.from('resort-images').upload(filePath, file);
      if (error) alert(error.message);
      else {
        const { data } = supabase.storage.from('resort-images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
    }
    setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    setUploading(false);
  };

  const removeImage = (index) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) { alert("Please upload at least one image."); return; }
    
    // Construct payload explicitly
    const payload = {
      name: formData.name,
      type: formData.type,
      description: formData.description,
      location: formData.location,
      price_sharing: formData.price_sharing,
      price_couple: formData.price_couple,
      check_in_time: formData.check_in_time,
      check_out_time: formData.check_out_time,
      distance_dandeli: formData.distance_dandeli,
      water_activity_distance: formData.water_activity_distance,
      activities_included: formData.activities_included,
      water_activities_included: formData.water_activities_included,
      paid_activities: formData.paid_activities,
      images: formData.images,
      details: formData.details,
      price: formData.price_sharing // Legacy fallback
    };

    if (editingResort) {
      const { error } = await supabase.from('resorts').update(payload).eq('id', editingResort.id);
      if (error) alert('Error: ' + error.message); 
      else alert('Resort Updated Successfully!');
    } else {
      const { error } = await supabase.from('resorts').insert([payload]);
      if (error) alert('Error: ' + error.message); 
      else alert('Resort Added Successfully!');
    }
    resetForm();
    setResorts(await fetchResorts());
  };

  const handleEdit = (resort) => {
    setEditingResort(resort);
    setFormData({
      ...INITIAL_FORM, ...resort,
      images: resort.images || [],
      details: resort.details || INITIAL_FORM.details,
      activities_included: resort.activities_included || '',
      water_activities_included: resort.water_activities_included || '',
      paid_activities: resort.paid_activities || '',
      water_activity_distance: resort.water_activity_distance || ''
    });
    window.history.pushState({ adminView: 'form' }, '');
    setView('form');
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this resort?')) {
      await supabase.from('resorts').delete().eq('id', id);
      setResorts(await fetchResorts());
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if(window.confirm('Delete this review?')) {
      await supabase.from('reviews').delete().eq('id', reviewId);
      setResorts(await fetchResorts());
      alert('Review Deleted');
    }
  };

  const resetForm = () => { setEditingResort(null); setFormData(INITIAL_FORM); setView('list'); };

  if (loading) return <div style={{padding: '2rem', textAlign: 'center', color: '#fff'}}>Loading...</div>;

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div className="login-page">
        <form onSubmit={handleLogin} className="login-form">
          <h2>Owner Login</h2>
          <input name="email" type="email" placeholder="Email Address" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit" className="btn-login">Sign In</button>
        </form>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="admin-app">
      {/* Header */}
      <header className="admin-header">
        <h1>Owner Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout">Sign Out</button>
      </header>

      {/* Navigation Tabs */}
      {view !== 'form' && (
        <nav className="admin-nav">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Resorts</button>
          <button className={view === 'reviews' ? 'active' : ''} onClick={() => setView('reviews')}>Reviews</button>
        </nav>
      )}

      <main className="admin-content">
        
        {/* --- VIEW: ADD/EDIT FORM --- */}
        {view === 'form' && (
          <div className="form-page">
            <div className="form-header">
              <button type="button" className="btn-back" onClick={resetForm}>Back</button>
              <h2>{editingResort ? 'Edit Resort' : 'Add New Resort'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="modern-form">
              
              {/* Section 1: Basic Info */}
              <section className="form-section">
                <div className="section-header">Basic Information</div>
                <div className="section-body">
                  <div className="input-group">
                    <label>Resort Name *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Jungle Retreat" required />
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Category</label>
                      <select name="type" value={formData.type} onChange={handleInputChange}>
                        <option value="budget">Budget</option>
                        <option value="premium">Premium</option>
                        <option value="bamboo">Bamboo</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Location</label>
                      <input name="location" value={formData.location} onChange={handleInputChange} placeholder="City/Area" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Brief description..."></textarea>
                  </div>
                </div>
              </section>

              {/* Section 2: Pricing (Water Activity Removed) */}
              <section className="form-section">
                <div className="section-header">Pricing & Timings</div>
                <div className="section-body">
                  <div className="input-row">
                    <div className="input-group">
                      <label>Sharing Rate (Per Person)</label>
                      <input type="number" name="price_sharing" value={formData.price_sharing} onChange={handleInputChange} placeholder="INR 0" />
                    </div>
                    <div className="input-group">
                      <label>Couple Rate (Per Person)</label>
                      <input type="number" name="price_couple" value={formData.price_couple} onChange={handleInputChange} placeholder="INR 0" />
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-group">
                      <label>Check-in</label>
                      <input name="check_in_time" value={formData.check_in_time} onChange={handleInputChange} placeholder="12:00 PM" />
                    </div>
                    <div className="input-group">
                      <label>Check-out</label>
                      <input name="check_out_time" value={formData.check_out_time} onChange={handleInputChange} placeholder="11:00 AM" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3: Activities */}
              <section className="form-section">
                <div className="section-header">Activities & Packages</div>
                <div className="section-body">
                  
                  <div className="input-group">
                    <label>Included in Package (Land/Resort)</label>
                    <textarea name="activities_included" value={formData.activities_included} onChange={handleInputChange} rows="2" placeholder="e.g. Campfire, Music, Indoor Games"></textarea>
                  </div>
                  
                  <div className="input-group" style={{marginTop: '15px'}}>
                    <label>Included in Package (Water Activities)</label>
                    <textarea name="water_activities_included" value={formData.water_activities_included} onChange={handleInputChange} rows="2" placeholder="e.g. Boating, Swimming Pool"></textarea>
                  </div>

                  <div className="input-group" style={{marginTop: '15px'}}>
                    <label>Paid Activities (Extra Charge)</label>
                    <textarea name="paid_activities" value={formData.paid_activities} onChange={handleInputChange} rows="2" placeholder="e.g. Jacuzzi Bath, Zipline, Special Safari"></textarea>
                  </div>

                </div>
              </section>

              {/* Section 4: Distances (Side-by-Side) */}
              <section className="form-section">
                <div className="section-header">Distances</div>
                <div className="section-body">
                  <div className="input-row">
                    <div className="input-group">
                      <label>Dist. from Dandeli Bus Stand</label>
                      <input name="distance_dandeli" value={formData.distance_dandeli} onChange={handleInputChange} placeholder="e.g. 10km" />
                    </div>
                    <div className="input-group">
                      <label>Water Activities Dist.</label>
                      <input name="water_activity_distance" value={formData.water_activity_distance} onChange={handleInputChange} placeholder="e.g. 2km" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5: Image Uploader */}
              <section className="form-section">
                <div className="section-header">Gallery (Max 15)</div>
                <div className="section-body">
                  <div className="upload-box">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} id="gallery-upload" />
                    <label htmlFor="gallery-upload" className="upload-label">
                      {uploading ? (
                        <span className="uploading-text">Uploading...</span>
                      ) : (
                        <>
                          <span className="upload-icon">+</span>
                          <span>Tap to Add Photos</span>
                        </>
                      )}
                    </label>
                  </div>

                  <div className="image-preview-grid">
                    {formData.images.map((url, idx) => (
                      <div key={idx} className="preview-item">
                        <img src={url} alt={`Preview ${idx}`} />
                        <button type="button" className="delete-img-btn" onClick={() => removeImage(idx)}>x</button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              
              {/* Spacer for sticky button */}
              <div style={{height: '80px'}}></div>

              {/* Sticky Submit Button */}
              <div className="sticky-save">
                <button type="submit" className="btn-save" disabled={uploading}>
                  {editingResort ? 'Save Changes' : 'Add Resort'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- VIEW: RESORTS LIST --- */}
        {view === 'list' && (
          <div className="list-page">
            <button onClick={() => { window.history.pushState({ adminView: 'form' }, ''); setView('form'); }} className="btn-add-new">
              + Add New Resort
            </button>
            <div className="resort-list">
              {resorts.length === 0 ? <p className="no-data">No resorts found.</p> : (
                resorts.map(resort => (
                  <div key={resort.id} className="resort-card">
                    <img src={resort.images?.[0] || 'https://via.placeholder.com/100'} alt={resort.name} className="card-thumb" />
                    <div className="card-info">
                      <h3>{resort.name}</h3>
                      <span className="badge">{resort.type}</span>
                    </div>
                    <div className="card-actions">
                      <button className="btn-edit" onClick={() => handleEdit(resort)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(resort.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: REVIEWS --- */}
        {view === 'reviews' && (
          <div className="reviews-page">
            <h2 className="page-title">All Reviews</h2>
            {resorts.map(resort => (
              resort.reviews && resort.reviews.length > 0 && (
                <div key={resort.id} className="review-section">
                  <h3>{resort.name} <span>({resort.reviews.length})</span></h3>
                  <div className="review-list">
                    {resort.reviews.map(rev => (
                      <div key={rev.id} className="review-item">
                        <div className="review-header">
                          <strong>{rev.user_name}</strong>
                          <span>{new Date(rev.created_at || rev.date).toLocaleDateString()}</span>
                        </div>
                        <p>{rev.text}</p>
                        <button className="btn-delete-text" onClick={() => handleDeleteReview(rev.id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </main>

      {/* --- EMBEDDED CSS --- */}
      <style>{`
        :root {
          --primary: #2cbf83;
          --surface: #111a25;
          --surface-2: #1a2430;
          --line: rgba(255, 255, 255, 0.08);
          --text: #ecf4fb;
          --text-muted: #9eb0c2;
        }

        .admin-app {
          background: linear-gradient(180deg, #0b121b, #111a25 180px, #111a25);
          min-height: 100svh;
          color: var(--text);
          max-width: 920px;
          margin: 0 auto;
          border-left: 1px solid var(--line);
          border-right: 1px solid var(--line);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
        }

        .admin-header {
          background: rgba(11, 18, 27, 0.92);
          padding: 16px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .admin-header h1 {
          font-size: 1.25rem;
          color: #9bf2cf;
          margin: 0;
        }

        .btn-logout {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-muted);
          padding: 7px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .admin-nav {
          display: flex;
          background: #121a25;
          padding: 0 20px;
          gap: 8px;
          border-bottom: 1px solid var(--line);
        }

        .admin-nav button {
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 15px 10px;
          font-size: 0.98rem;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 600;
        }

        .admin-nav button.active {
          color: var(--text);
          border-bottom-color: var(--primary);
        }

        .admin-content {
          padding-bottom: 14px;
        }

        .login-page {
          position: relative;
          min-height: 100svh;
          background:
            linear-gradient(rgba(6, 12, 20, 0.72), rgba(6, 12, 20, 0.72)),
            url('https://images.unsplash.com/photo-1586438200369-7e9c7c3f58aa?auto=format&fit=crop&w=1500&q=80') center/cover;
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .welcome-text,
        .login-form {
          width: min(430px, 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(8px);
          animation: fadeIn 0.25s ease;
        }

        .welcome-text {
          text-align: center;
          cursor: pointer;
          background: rgba(7, 14, 23, 0.65);
          padding: 34px 28px;
        }

        .welcome-text h1 {
          font-size: 2.2rem;
          color: #fff;
          margin-bottom: 12px;
        }

        .welcome-text p {
          color: #d7e4ef;
          font-size: 1rem;
          margin-bottom: 14px;
        }

        .btn-tap {
          background: linear-gradient(135deg, #2cbf83, #1f9767);
          color: #fff;
          border: none;
          padding: 11px 28px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.94rem;
          cursor: pointer;
        }

        .login-form {
          background: rgba(245, 250, 255, 0.96);
          padding: 34px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .login-form h2 {
          text-align: center;
          margin-bottom: 22px;
          color: #0f2030;
          width: 100%;
        }

        .login-form input {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: 1px solid #ced8e2;
          background: #f5f8fc;
          color: #1f2a35;
          margin-bottom: 12px;
          font-size: 0.98rem;
        }

        .login-form input:focus {
          border-color: var(--primary);
          outline: none;
          background: #fff;
        }

        .btn-login {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #2cbf83, #1f9767);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.98rem;
          cursor: pointer;
        }

        .list-page,
        .reviews-page,
        .form-page {
          padding: 22px;
        }

        .btn-add-new {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2cbf83, #1f9767);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 18px;
          cursor: pointer;
        }

        .resort-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .resort-card {
          background: var(--surface-2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          overflow: hidden;
          border: 1px solid var(--line);
        }

        .card-thumb {
          width: 82px;
          height: 82px;
          object-fit: cover;
        }

        .card-info {
          flex: 1;
          padding: 14px;
        }

        .card-info h3 {
          margin: 0 0 6px 0;
          font-size: 0.98rem;
        }

        .badge {
          font-size: 0.72rem;
          background: rgba(255, 255, 255, 0.08);
          padding: 3px 8px;
          border-radius: 999px;
          text-transform: capitalize;
          color: #c3d4e5;
        }

        .card-actions {
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-actions button {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-edit {
          background: #2569d6;
          color: white;
        }

        .btn-delete {
          background: #d84a32;
          color: white;
        }

        .page-title {
          margin-bottom: 16px;
        }

        .review-section {
          background: var(--surface-2);
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 14px;
          border: 1px solid var(--line);
        }

        .review-section h3 {
          margin: 0 0 14px 0;
          color: #9bf2cf;
          font-size: 1.05rem;
        }

        .review-section h3 span {
          color: #7c8ea0;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .review-item {
          background: #0f1721;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 10px;
          border-left: 3px solid #2d3e51;
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 0.88rem;
          color: #9eb0c2;
        }

        .review-item p {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.4;
          color: #d3e1ee;
        }

        .btn-delete-text {
          background: none;
          border: none;
          color: #ff7d7d;
          font-size: 0.8rem;
          margin-top: 9px;
          cursor: pointer;
          padding: 0;
        }

        .form-header {
          padding: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid var(--line);
          margin-bottom: 18px;
        }

        .form-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: var(--text);
        }

        .btn-back {
          background: none;
          border: none;
          color: #9bf2cf;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 700;
        }

        .modern-form {
          padding: 0;
        }

        .form-section {
          background: var(--surface-2);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 18px;
          border: 1px solid var(--line);
        }

        .section-header {
          background: rgba(255, 255, 255, 0.04);
          padding: 12px 16px;
          font-weight: 700;
          font-size: 0.98rem;
          color: #9bf2cf;
          border-bottom: 1px solid var(--line);
        }

        .section-body {
          padding: 16px;
        }

        .input-group {
          margin-bottom: 16px;
          width: 100%;
        }

        .input-group:last-child {
          margin-bottom: 0;
        }

        .input-group label {
          display: block;
          margin-bottom: 7px;
          font-size: 0.88rem;
          color: var(--text-muted);
        }

        .input-group input,
        .input-group select,
        .input-group textarea {
          width: 100%;
          background: #0f1721;
          border: 1px solid #2f3f50;
          border-radius: 10px;
          padding: 12px;
          color: var(--text);
          font-size: 0.96rem;
          box-sizing: border-box;
        }

        .input-group input:focus,
        .input-group textarea:focus,
        .input-group select:focus {
          border-color: #50d6a2;
          outline: none;
        }

        .input-row {
          display: flex;
          gap: 14px;
        }

        .input-row .input-group {
          flex: 1;
        }

        .upload-box {
          margin-bottom: 14px;
          position: relative;
        }

        .upload-box input {
          opacity: 0;
          position: absolute;
          width: 100%;
          height: 100%;
          cursor: pointer;
          z-index: 2;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 112px;
          border: 2px dashed #37495c;
          border-radius: 12px;
          color: #9eb0c2;
          cursor: pointer;
        }

        .upload-icon {
          font-size: 1.9rem;
          font-weight: 300;
          margin-bottom: 5px;
        }

        .image-preview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .preview-item {
          position: relative;
          padding-top: 100%;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }

        .preview-item img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .delete-img-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.72);
          color: #ff8585;
          border: 1px solid #ff8585;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 0.92rem;
          line-height: 1;
          cursor: pointer;
        }

        .sticky-save {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: min(100%, 920px);
          background: linear-gradient(to top, #111a25 80%, transparent);
          padding: 18px 22px;
          border-left: 1px solid var(--line);
          border-right: 1px solid var(--line);
        }

        .btn-save {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #2cbf83, #1f9767);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 12px 22px rgba(44, 191, 131, 0.24);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 940px) {
          .admin-app {
            max-width: 100%;
            border-left: none;
            border-right: none;
            box-shadow: none;
          }

          .sticky-save {
            width: 100%;
            border-left: none;
            border-right: none;
            padding: 16px;
          }
        }

        @media (max-width: 700px) {
          .list-page,
          .reviews-page,
          .form-page {
            padding: 16px;
          }

          .input-row {
            flex-direction: column;
            gap: 0;
          }

          .card-actions {
            padding-right: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
