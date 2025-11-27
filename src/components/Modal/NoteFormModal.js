/**
 * File Name: NoteFormModal.js
 * Location: src/components/Modal/NoteFormModal.js
 * Purpose: Updated with safety checks (|| '') to prevent "uncontrolled input" console errors.
 */
import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Link, Upload } from 'lucide-react';
import styles from './Modal.module.css';

// --- UPDATED CATEGORIES (Must match src/app/page.js) ---
const CATEGORIES = [
  { id: 'services_offered', label: 'Services Offered', color: '#FFD700' }, 
  { id: 'services_required', label: 'Services Required', color: '#FF4081' }, 
  { id: 'looking_for', label: 'Looking For', color: '#FF6D00' }, 
  { id: 'jobs', label: 'Job Search', color: '#00B0FF' }, 
  { id: 'for_sale', label: 'For Sale', color: '#00E676' }, 
  { id: 'events', label: 'Events', color: '#D500F9' }, 
];

const NoteFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [loading, setLoading] = useState(false);
  
  // Image Mode State: 'url' or 'file'
  const [imageMode, setImageMode] = useState('url'); 
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    category: 'services_offered',
    title: '',
    description: '',
    contactName: '',
    contactPhone: '',
    location: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.type || 'services_offered',
        title: initialData.title || '',
        description: initialData.description || '',
        contactName: initialData.contactName || '',
        contactPhone: initialData.contactPhone || '',
        location: initialData.location || '',
        imageUrl: initialData.imageUrl || '',
      });
      // Default to URL mode if editing existing note (simplifies logic)
      setImageMode('url');
      setImageFile(null);
    } else {
      setFormData({
        category: 'services_offered', title: '', description: '', 
        contactName: '', contactPhone: '', location: '', imageUrl: ''
      });
      setImageMode('url');
      setImageFile(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const categoryConfig = CATEGORIES.find(c => c.id === formData.category);

    try {
      // Pass both form data AND the raw file (if any) to parent
      await onSubmit({
        ...formData,
        type: formData.category,
        color: categoryConfig ? categoryConfig.color : '#ffffff',
        imageFile: imageMode === 'file' ? imageFile : null
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while pinning the note.");
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!initialData;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.formContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {isEdit ? <Pencil size={20} /> : <Plus size={20} />}
            {isEdit ? 'Update Sticky Note' : 'Pin a New Note'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form className={styles.formBody} onSubmit={handleSubmit}>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Section</label>
            <select 
              className={styles.select}
              value={formData.category || 'services_offered'} // Safety check
              onChange={e => setFormData({...formData, category: e.target.value})}
              disabled={isEdit} 
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Title</label>
            <input 
              className={styles.input}
              required
              maxLength={50}
              placeholder="e.g. Selling 2015 Toyota..."
              value={formData.title || ''} // Added safety check
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea 
              className={styles.textarea}
              required
              rows={4}
              placeholder="Details about the service..."
              value={formData.description || ''} // Added safety check
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Name</label>
              <input 
                className={styles.input}
                required
                value={formData.contactName || ''} // Added safety check
                onChange={e => setFormData({...formData, contactName: e.target.value})}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone/Email</label>
              <input 
                className={styles.input}
                required
                value={formData.contactPhone || ''} // Added safety check
                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Location (Optional)</label>
            <input 
              className={styles.input}
              value={formData.location || ''} // Added safety check
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
          </div>

          {/* --- IMAGE TOGGLE SECTION --- */}
          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className={styles.label} style={{ marginBottom: 0 }}>Attachment</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setImageMode('url')}
                  style={{ 
                    background: imageMode === 'url' ? '#3b82f6' : '#e2e8f0',
                    color: imageMode === 'url' ? 'white' : '#64748b',
                    border: 'none', 
                    borderRadius: '4px', 
                    padding: '4px 8px', 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Link size={12} /> Link
                </button>
                <button 
                  type="button" 
                  onClick={() => setImageMode('file')}
                  style={{ 
                    background: imageMode === 'file' ? '#3b82f6' : '#e2e8f0',
                    color: imageMode === 'file' ? 'white' : '#64748b',
                    border: 'none', 
                    borderRadius: '4px', 
                    padding: '4px 8px', 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Upload size={12} /> Upload
                </button>
              </div>
            </div>

            {imageMode === 'url' ? (
              <input 
                className={styles.input}
                placeholder="https://example.com/photo.jpg"
                value={formData.imageUrl || ''} // Added safety check
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            ) : (
              <input 
                type="file"
                accept="image/*"
                className={styles.input}
                onChange={e => setImageFile(e.target.files[0])}
                style={{ padding: '0.5rem' }}
              />
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Stick It!')}
          </button>

        </form>
      </div>
    </div>
  );
};

export default NoteFormModal;