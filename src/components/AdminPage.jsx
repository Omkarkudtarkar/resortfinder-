import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

const AdminPanel = () => {
  // --- State Management ---
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resorts, setResorts] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'form', 'reviews'
  const [editingResort, setEditingResort] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showLoginText, setShowLoginText] = useState(true);

  const initialForm = {
    name: '', type: 'budget', description: '', location: '',
    price_sharing: '', price_couple: '', price_water_activity: '600',
    check_in_time: '', check_out_time: '',
    distance_dandeli: '', distance_hub: '',
    activities_included: '', water_activities: '',
    images: [], details: { pricing: '', meals: '', activities: '' }
  };
  const [formData, setFormData] = useState(initialForm);

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
    window.onpopstate = (e) => {
      if (view === 'form') {
        setView('list');
        setEditingResort(null);
        setFormData(initialForm);
      }
    };
    return () => { window.onpopstate = null; };
  }, [session, view]);

  useEffect(() => { if (session) fetchResorts(); }, [session]);

  const fetchResorts = async () => {
    const { data, error } = await supabase.from('resorts').select('*, reviews(*)');
    if (error) console.error(error);
    else setResorts(data || []);
  };

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
    const payload = { ...formData, price: formData.price_sharing };

    if (editingResort) {
      const { error } = await supabase.from('resorts').update(payload).eq('id', editingResort.id);
      if (error) alert('Error: ' + error.message); else alert('Resort Updated!');
    } else {
      const { error } = await supabase.from('resorts').insert([payload]);
      if (error) alert('Error: ' + error.message); else alert('Resort Added!');
    }
    resetForm();
    fetchResorts();
  };

  const handleEdit = (resort) => {
    setEditingResort(resort);
    setFormData({
      ...initialForm, ...resort,
      images: resort.images || [],
      details: resort.details || initialForm.details,
      price_sharing: resort.price_sharing || resort.price || '',
      price_couple: resort.price_couple || '',
      water_activities: resort.water_activities || '',
      activities_included: resort.activities_included || '',
      distance_dandeli: resort.distance_dandeli || '',
      distance_hub: resort.distance_hub || '',
      check_in_time: resort.check_in_time || '',
      check_out_time: resort.check_out_time || ''
    });
    window.history.pushState({ adminView: 'form' }, '');
    setView('form');
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this resort?')) {
      await supabase.from('resorts').delete().eq('id', id);
      fetchResorts();
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if(window.confirm('Delete this review?')) {
      await supabase.from('reviews').delete().eq('id', reviewId);
      fetchResorts(); alert('Review Deleted');
    }
  };

  const resetForm = () => { setEditingResort(null); setFormData(initialForm); setView('list'); };

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading...</div>;

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div className="login-page">
        {showLoginText ? (
          <div className="welcome-text" onClick={() => setShowLoginText(false)}>
            <h1>Hello!</h1>
            <p>The Owner Dashboard is accessible only to resort owners.</p>
            <p>Have you selected your resort?</p>
            <button className="btn-tap">Tap here to Login</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="login-form">
            <h2>Owner Login</h2>
            <input name="email" type="email" placeholder="Email Address" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit" className="btn-login">Sign In</button>
          </form>
        )}
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
        
        {/* --- VIEW: ADD/EDIT FORM (REDESIGNED) --- */}
        {view === 'form' && (
          <div className="form-page">
            <div className="form-header">
              <button type="button" className="btn-back" onClick={resetForm}>← Back</button>
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

              {/* Section 2: Pricing */}
              <section className="form-section">
                <div className="section-header">Pricing & Timings</div>
                <div className="section-body">
                  <div className="input-row">
                    <div className="input-group">
                      <label>Sharing Rate (Per Person)</label>
                      <input type="number" name="price_sharing" value={formData.price_sharing} onChange={handleInputChange} placeholder="₹ 0" />
                    </div>
                    <div className="input-group">
                      <label>Couple Rate (Per Person)</label>
                      <input type="number" name="price_couple" value={formData.price_couple} onChange={handleInputChange} placeholder="₹ 0" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Water Activity Package (Extra)</label>
                    <input type="number" name="price_water_activity" value={formData.price_water_activity} onChange={handleInputChange} />
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

              {/* Section 3: Location & Activities */}
              <section className="form-section">
                <div className="section-header">Location & Activities</div>
                <div className="section-body">
                  <div className="input-row">
                    <div className="input-group">
                      <label>Dist. from Dandeli</label>
                      <input name="distance_dandeli" value={formData.distance_dandeli} onChange={handleInputChange} placeholder="e.g. 10km" />
                    </div>
                    <div className="input-group">
                      <label>Dist. from Hub</label>
                      <input name="distance_hub" value={formData.distance_hub} onChange={handleInputChange} placeholder="e.g. 2km" />
                    </div>
                  </div>
                  
                  <div className="input-group" style={{marginTop: '15px'}}>
                    <label>Included Activities (Free)</label>
                    <textarea name="activities_included" value={formData.activities_included} onChange={handleInputChange} rows="2" placeholder="Campfire, Music..."></textarea>
                  </div>
                  
                  <div className="input-group">
                    <label>Water Activities (Paid)</label>
                    <textarea name="water_activities" value={formData.water_activities} onChange={handleInputChange} rows="2" placeholder="Rafting, Boating..."></textarea>
                  </div>
                </div>
              </section>

              {/* Section 4: Image Uploader (New UI) */}
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
                        <button type="button" className="delete-img-btn" onClick={() => removeImage(idx)}>×</button>
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
        /* --- Global Admin Styles --- */
        .admin-app {
          background-color: #121212;
          min-height: 100vh;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* Header */
        .admin-header {
          background: #1f1f1f;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .admin-header h1 { font-size: 1.2rem; color: var(--primary); margin: 0; }
        .btn-logout { background: transparent; border: 1px solid #444; color: #aaa; padding: 5px 10px; border-radius: 4px; }

        /* Navigation Tabs */
        .admin-nav {
          display: flex;
          background: #1f1f1f;
          padding: 0 20px;
          gap: 10px;
          border-bottom: 1px solid #333;
        }
        .admin-nav button {
          background: none;
          border: none;
          color: #888;
          padding: 15px 10px;
          font-size: 1rem;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }
        .admin-nav button.active { color: #fff; border-bottom-color: var(--primary); }

        /* --- Login Page --- */
        .login-page { background: #121212; height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .welcome-text { text-align: center; cursor: pointer; animation: fadeIn 0.5s; }
        .welcome-text h1 { font-size: 2.5rem; color: var(--primary); margin-bottom: 10px; }
        .welcome-text p { color: #aaa; font-size: 1.1rem; margin-bottom: 20px; }
        .btn-tap { background: var(--primary); color: #000; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; font-size: 1rem; cursor: pointer; }
        .login-form { width: 100%; max-width: 400px; background: #1e1e1e; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .login-form h2 { text-align: center; margin-bottom: 20px; color: var(--primary); }
        .login-form input { width: 100%; padding: 14px; border-radius: 8px; border: 1px solid #333; background: #121212; color: #fff; margin-bottom: 15px; }
        .btn-login { width: 100%; padding: 14px; background: var(--primary); color: #000; border: none; border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer; }

        /* --- Resort List View --- */
        .list-page { padding: 20px; }
        .btn-add-new { width: 100%; padding: 15px; background: var(--primary); color: #000; border: none; border-radius: 12px; font-size: 1rem; font-weight: bold; margin-bottom: 20px; cursor: pointer; }
        .resort-list { display: flex; flex-direction: column; gap: 15px; }
        .resort-card { background: #1e1e1e; border-radius: 12px; display: flex; align-items: center; overflow: hidden; border: 1px solid #333; }
        .card-thumb { width: 80px; height: 80px; object-fit: cover; }
        .card-info { flex: 1; padding: 15px; }
        .card-info h3 { margin: 0 0 5px 0; font-size: 1rem; }
        .badge { font-size: 0.75rem; background: #333; padding: 2px 8px; border-radius: 4px; text-transform: capitalize; }
        .card-actions { padding: 10px; display: flex; gap: 10px; }
        .card-actions button { padding: 6px 12px; border-radius: 6px; border: none; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
        .btn-edit { background: #2979ff; color: white; }
        .btn-delete { background: #ff3d00; color: white; }

        /* --- Review View --- */
        .reviews-page { padding: 20px; }
        .page-title { margin-bottom: 20px; }
        .review-section { background: #1e1e1e; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .review-section h3 { margin: 0 0 15px 0; color: var(--primary); }
        .review-item { background: #121212; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
        .review-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem; color: #aaa; }
        .review-item p { margin: 0; font-size: 0.95rem; line-height: 1.4; }
        .btn-delete-text { background: none; border: none; color: #ff5252; font-size: 0.8rem; margin-top: 10px; cursor: pointer; padding: 0; }

        /* --- Modern Form View --- */
        .form-page { padding-bottom: 20px; }
        .form-header { padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #333; margin-bottom: 20px; }
        .form-header h2 { margin: 0; font-size: 1.2rem; color: #fff; }
        .btn-back { background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer; padding: 0; }

        .modern-form { padding: 0 20px; }
        
        /* Section Card */
        .form-section { background: #1e1e1e; border-radius: 16px; overflow: hidden; margin-bottom: 20px; border: 1px solid #333; }
        .section-header { background: #252525; padding: 12px 20px; font-weight: bold; font-size: 1rem; color: var(--primary); border-bottom: 1px solid #333; }
        .section-body { padding: 20px; }

        /* Inputs */
        .input-group { margin-bottom: 20px; width: 100%; }
        .input-group:last-child { margin-bottom: 0; }
        .input-group label { display: block; margin-bottom: 8px; font-size: 0.9rem; color: #aaa; }
        .input-group input, .input-group select, .input-group textarea {
          width: 100%; background: #121212; border: 1px solid #444; border-radius: 8px;
          padding: 14px; color: #fff; font-size: 1rem; box-sizing: border-box;
        }
        .input-group input:focus, .input-group textarea:focus { border-color: var(--primary); outline: none; }
        .input-row { display: flex; gap: 15px; }
        .input-row .input-group { flex: 1; }

        /* Image Uploader */
        .upload-box { margin-bottom: 15px; position: relative; }
        .upload-box input { opacity: 0; position: absolute; width: 100%; height: 100%; cursor: pointer; z-index: 2; }
        .upload-label { 
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          width: 100%; height: 120px; border: 2px dashed #444; border-radius: 12px; color: #aaa; cursor: pointer;
        }
        .upload-icon { font-size: 2rem; font-weight: 300; margin-bottom: 5px; }
        
        .image-preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .preview-item { position: relative; padding-top: 100%; background: #000; border-radius: 8px; overflow: hidden; }
        .preview-item img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
        .delete-img-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.7); color: #ff5252; border: 1px solid #ff5252; border-radius: 50%; width: 24px; height: 24px; font-size: 1.2rem; line-height: 22px; cursor: pointer; }

        /* Sticky Save Button */
        .sticky-save { position: fixed; bottom: 0; left: 0; right: 0; background: #121212; padding: 15px 20px; border-top: 1px solid #333; }
        .btn-save { width: 100%; padding: 15px; background: var(--primary); color: #000; border: none; border-radius: 12px; font-weight: bold; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }

        /* Responsive */
        @media (min-width: 768px) {
          .admin-app { max-width: 600px; margin: 0 auto; border-left: 1px solid #333; border-right: 1px solid #333; }
          .sticky-save { max-width: 600px; left: 50%; transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;