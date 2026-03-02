import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

const AdminPanel = () => {
  // Auth State
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [resorts, setResorts] = useState([]);
  const [editingResort, setEditingResort] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', type: 'budget', price: '', location: '', description: '',
    images: [], 
    // New Fields
    distance_railway: '',
    distance_bus_stand: '',
    water_activities: '',
    other_activities: '',
    details: { pricing: '', meals: '', activities: '' }
  });

  // --- 1. Authentication Logic ---
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

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = e.target.elements;
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- 2. Data Fetching Logic ---
  useEffect(() => {
    if (session) fetchResorts();
  }, [session]);

  const fetchResorts = async () => {
    const { data } = await supabase.from('resorts').select('*');
    if (data) setResorts(data);
  };

  // --- 3. Form Logic ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('detail_')) {
      const key = name.replace('detail_', '');
      setFormData(prev => ({
        ...prev,
        details: { ...prev.details, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- 4. Image Upload Logic ---
  
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max limit
    const currentCount = formData.images.length;
    const newCount = files.length;
    if (currentCount + newCount > 15) {
      alert(`You can only upload ${15 - currentCount} more images.`);
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload to Supabase Storage
      let { error: uploadError } = await supabase.storage
        .from('resort-images') // Ensure this bucket exists in Supabase
        .upload(filePath, file);

      if (uploadError) {
        alert(`Error uploading ${file.name}: ${uploadError.message}`);
      } else {
        // Get Public URL
        const { data } = supabase.storage.from('resort-images').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls]
    }));
    setUploading(false);
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.images.length === 0) {
        alert("Please upload at least one image.");
        return;
    }

    if (editingResort) {
      const { error } = await supabase
        .from('resorts')
        .update(formData)
        .eq('id', editingResort.id);
      
      if (error) alert('Error updating: ' + error.message);
      else alert('Resort Updated!');
    } else {
      const { error } = await supabase
        .from('resorts')
        .insert([formData]);
      
      if (error) alert('Error adding: ' + error.message);
      else alert('Resort Added!');
    }

    resetForm();
    fetchResorts();
  };

  const handleEdit = (resort) => {
    setEditingResort(resort);
    setFormData({
      ...resort,
      // Ensure arrays and objects exist to prevent crashes
      images: resort.images || [],
      details: resort.details || { pricing: '', meals: '', activities: '' },
      distance_railway: resort.distance_railway || '',
      distance_bus_stand: resort.distance_bus_stand || '',
      water_activities: resort.water_activities || '',
      other_activities: resort.other_activities || ''
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this resort?')) {
      await supabase.from('resorts').delete().eq('id', id);
      fetchResorts();
    }
  };

  const handleDeleteReview = async (resortId, reviewId) => {
    if(window.confirm('Delete this review?')) {
      await supabase.from('reviews').delete().eq('id', reviewId);
      fetchResorts(); 
      alert('Review Deleted');
    }
  };

  const resetForm = () => {
    setEditingResort(null);
    setFormData({
      name: '', type: 'budget', price: '', location: '', description: '',
      images: [],
      distance_railway: '',
      distance_bus_stand: '',
      water_activities: '',
      other_activities: '',
      details: { pricing: '', meals: '', activities: '' }
    });
  };

  // --- Render ---

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading...</div>;

  // Login Screen
  if (!session) {
    return (
      <div className="admin-container" style={{maxWidth: '400px', marginTop: '100px'}}>
        <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Admin Login</h2>
        <form onSubmit={handleLogin} className="admin-form">
          <input name="email" type="email" placeholder="Email / Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit" className="form-btn primary">Sign In</button>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="admin-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h1 style={{color: 'var(--primary)', margin: 0}}>Owner Dashboard</h1>
        <button onClick={handleLogout} className="form-btn secondary" style={{width: 'auto', padding: '8px 16px'}}>Sign Out</button>
      </div>
      
      <form className="admin-form" onSubmit={handleSubmit}>
        <h2>{editingResort ? 'Edit Resort' : 'Add New Resort'}</h2>
        
        <div className="form-row">
          <input name="name" placeholder="Resort Name" value={formData.name} onChange={handleInputChange} required />
          <select name="type" value={formData.type} onChange={handleInputChange}>
            <option value="budget">Budget</option>
            <option value="premium">Premium</option>
            <option value="bamboo">Bamboo</option>
          </select>
        </div>

        <input name="location" placeholder="Location" value={formData.location} onChange={handleInputChange} />
        <input name="price" placeholder="Price (e.g. ₹2000/night)" value={formData.price} onChange={handleInputChange} />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} />

        {/* New Location Distance Fields */}
        <div className="form-row" style={{marginTop: '15px'}}>
            <input 
                name="distance_railway" 
                placeholder="Distance from Railway Station (e.g. 10km)" 
                value={formData.distance_railway} 
                onChange={handleInputChange} 
            />
            <input 
                name="distance_bus_stand" 
                placeholder="Distance from Dandeli Bus Stand" 
                value={formData.distance_bus_stand} 
                onChange={handleInputChange} 
            />
        </div>

        {/* New Activities Fields */}
        <h3 style={{marginTop: '15px'}}>Activities (Extra Payment)</h3>
        <input 
            name="water_activities" 
            placeholder="Water Activities (e.g. River Rafting, Kayaking)" 
            value={formData.water_activities} 
            onChange={handleInputChange} 
        />
        <input 
            name="other_activities" 
            placeholder="Other Activities (e.g. Jungle Safari, Trekking)" 
            value={formData.other_activities} 
            onChange={handleInputChange} 
        />

        <h3>Details</h3>
        <textarea name="detail_pricing" placeholder="Pricing Info" value={formData.details.pricing} onChange={handleInputChange} />
        <textarea name="detail_meals" placeholder="Meals Info" value={formData.details.meals} onChange={handleInputChange} />
        <textarea name="detail_activities" placeholder="General Activities Info" value={formData.details.activities} onChange={handleInputChange} />

        {/* Image Upload Section */}
        <h3>Resort Images (Max 15)</h3>
        
        <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '10px', color: '#ccc'}}>
                {uploading ? 'Uploading...' : 'Click to upload images from system'}
            </label>
            <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading || formData.images.length >= 15}
                style={{border: '2px dashed #555', padding: '10px', width: '100%', background: '#222'}}
            />
        </div>

        {/* Image Previews */}
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px'}}>
            {formData.images.map((url, idx) => (
                <div key={idx} style={{position: 'relative', width: '100px', height: '100px'}}>
                    <img 
                        src={url} 
                        alt={`Preview ${idx}`} 
                        style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} 
                    />
                    <button 
                        type="button" 
                        onClick={() => removeImage(idx)}
                        style={{position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 'bold'}}
                    >
                        X
                    </button>
                </div>
            ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="form-btn primary" disabled={uploading}>
            {editingResort ? 'Update Resort' : 'Add Resort'}
          </button>
          {editingResort && (
            <button type="button" className="form-btn secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Resort List & Review Management */}
      <div className="admin-dashboard">
        <h2>Your Resorts</h2>
        {resorts.length === 0 ? <p>No resorts found.</p> : (
          resorts.map(resort => (
            <div key={resort.id} className="admin-card">
              <div>
                <h3>{resort.name} <span style={{fontSize: '0.8rem', color: '#aaa'}}>({resort.type})</span></h3>
                <p style={{fontSize: '0.9rem', color: '#ccc'}}>Reviews: {resort.reviews?.length || 0}</p>
              </div>
              <div className="admin-actions">
                <button className="btn-edit" onClick={() => handleEdit(resort)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(resort.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
        
        <div style={{marginTop: '40px'}}>
          <h2>Manage Reviews</h2>
          {resorts.filter(r => r.reviews && r.reviews.length > 0).map(resort => (
            <div key={resort.id} style={{marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px'}}>
              <h4>Reviews for: {resort.name}</h4>
              {resort.reviews.map(rev => (
                <div key={rev.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', padding: '10px 0'}}>
                  <div>
                    <strong>{rev.user_name}</strong> <span style={{color: '#aaa', fontSize: '0.8rem'}}>{rev.date}</span>
                    <p style={{margin: '5px 0', fontSize: '0.9rem'}}>{rev.text}</p>
                  </div>
                  <button className="btn-delete" style={{height: 'fit-content'}} onClick={() => handleDeleteReview(resort.id, rev.id)}>Delete</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;