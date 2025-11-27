/**
 * File Name: NoteDetailModal.js
 * Location: src/components/Modal/NoteDetailModal.js
 * Purpose: Updated to make Phone and Contact info CLICKABLE (Actionable links).
 */
import React from 'react';
import { X, User, Phone, MapPin, Tag } from 'lucide-react';
import styles from './Modal.module.css';

const NoteDetailModal = ({ note, onClose }) => {
  if (!note) return null;

  // Calculate days remaining dynamically
  const calculateDaysRemaining = () => {
    let expiryDate;
    if (note.expiresAt) {
      expiryDate = new Date(note.expiresAt.seconds * 1000);
    } else if (note.createdAt) {
      const created = new Date(note.createdAt.seconds * 1000);
      expiryDate = new Date(created);
      expiryDate.setDate(created.getDate() + 14); 
    } else {
      return 14; 
    }

    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpired = daysRemaining <= 0;
  const activeLabel = isExpired ? 'Expired' : `Active for ${daysRemaining} Days`;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div 
        className={styles.detailContainer} 
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: note.color }} 
      >
        <button className={styles.detailCloseBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.detailContent} style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
          <div className={styles.pinHole} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}></div>

          <div className={styles.detailLayout}>
            {/* Left Side: Text Content */}
            <div className={styles.textContent}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: '800', 
                  textTransform: 'uppercase',
                  color: 'white',
                  letterSpacing: '0.05em',
                  border: '1px solid rgba(255,255,255,0.4)'
                }}>
                  {note.type?.replace('_', ' ') || 'NOTE'}
                </span>
                {isExpired && (
                  <span style={{ 
                    background: '#ff1744', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: '800', 
                    textTransform: 'uppercase',
                    color: 'white',
                  }}>
                    EXPIRED
                  </span>
                )}
              </div>
              
              <h2 className={styles.detailTitle} style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {note.title}
              </h2>
              <p className={styles.detailDesc} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>
                {note.description}
              </p>

              {/* Contact Info Grid - NOW CLICKABLE */}
              <div className={styles.contactGrid} style={{ borderTopColor: 'rgba(255,255,255,0.3)' }}>
                
                <div className={styles.contactItem} style={{ color: 'white' }}>
                  <User size={18} color="white" /> 
                  <strong>{note.contactName}</strong>
                </div>

                {/* Clickable Phone Number */}
                <a 
                  href={`tel:${note.contactPhone}`}
                  className={styles.contactItem} 
                  style={{ color: 'white', textDecoration: 'none', cursor: 'pointer' }}
                  title="Call now"
                >
                  <Phone size={18} color="white" /> 
                  <strong style={{ borderBottom: '1px dotted white' }}>{note.contactPhone}</strong>
                </a>

                {note.location && (
                  <div className={styles.contactItem} style={{ color: 'white' }}>
                    <MapPin size={18} color="white" /> 
                    <span>{note.location}</span>
                  </div>
                )}
                
                <div className={styles.contactItem} style={{ color: 'white' }}>
                  <Tag size={18} color="white" /> 
                  <span>{activeLabel}</span>
                </div>
              </div>

              <div className={styles.warningBox} style={{ 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white'
              }}>
                <strong>Safety Tip:</strong> TTTEDDEL BOARD connects people but does not verify listings. 
                Please meet in public places and never send money upfront.
              </div>
            </div>

            {/* Right Side: Image Attachment */}
            {note.imageUrl && (
              <div className={styles.imageArea}>
                <img src={note.imageUrl} alt="Note Attachment" className={styles.detailImage} style={{ borderColor: 'white' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailModal;