/**
 * File Name: StickyNote.js
 * Location: src/components/StickyNote/StickyNote.js
 * Purpose: Individual note component. Handles displaying data and "owner" buttons with VIBRANT THEMES.
 */

import React, { useMemo } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import styles from './StickyNote.module.css';

const StickyNote = ({ note, onClick, isOwner, onDelete, onEdit }) => {
  // Randomly rotate the note between -3deg and 3deg for realism
  const rotation = useMemo(() => Math.floor(Math.random() * 6) - 3, []);

  // Determine theme class based on category type (e.g., theme_services_offered)
  // This maps the note.type to the specific CSS class with the background pattern
  const themeClass = styles[`theme_${note.type}`] || '';

  return (
    <div
      onClick={() => onClick(note)}
      // Apply base wrapper class AND specific theme class
      className={`${styles.noteWrapper} ${themeClass}`}
      style={{
        backgroundColor: note.color,
        transform: `rotate(${rotation}deg)`
      }}
    >
      {/* The Red Pin at the top */}
      <div className={styles.pin}>
        <div className={styles.pinHead}></div>
        <div className={styles.pinNeedle}></div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{note.title}</h3>
        <p className={styles.description}>{note.description}</p>
      </div>

      {note.imageUrl && (
        <div className={styles.imageContainer}>
          <img src={note.imageUrl} alt="attachment" className={styles.image} />
        </div>
      )}

      <div className={styles.footer}>
        {/* Format timestamp to date */}
        <span>
          {note.createdAt?.seconds 
            ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() 
            : 'Just now'}
        </span>

        {/* Only show Edit/Delete if the current user owns this note */}
        {isOwner && (
          <div className={styles.actions}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(note); }}
              className={`${styles.actionBtn} ${styles.editBtn}`}
              title="Edit Note"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              title="Tear Down"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyNote;