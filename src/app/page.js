/**
 * File Name: page.js
 * Location: src/app/page.js
 * Purpose: Main board logic. Uses Email/Password Auth. Checks for Email Verification before posting.
 */
'use client'; 

import React, { useState, useEffect } from 'react';
import { Search, Plus, Layers, LogIn, User, RefreshCw } from 'lucide-react';
import { 
  onAuthStateChanged, 
  signOut,
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';

import { auth, db, storage } from '../lib/firebase'; 
import StickyNote from '@/components/StickyNote/StickyNote';
import NoteFormModal from '@/components/Modal/NoteFormModal';
import NoteDetailModal from '@/components/Modal/NoteDetailModal';
import LoginModal from '@/components/Modal/LoginModal'; 
import styles from './page.module.css';

// --- CATEGORIES ---
const CATEGORIES = [
  { id: 'services_offered', label: 'Services Offered', color: '#FFD700' }, 
  { id: 'services_required', label: 'Services Required', color: '#FF4081' }, 
  { id: 'looking_for', label: 'Looking For', color: '#FF6D00' }, 
  { id: 'jobs', label: 'Job Search', color: '#00B0FF' }, 
  { id: 'for_sale', label: 'For Sale', color: '#00E676' }, 
  { id: 'events', label: 'Events', color: '#D500F9' }, 
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('services_offered');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false); 
  const [editingNote, setEditingNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  // 1. Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Notes (Public Read)
  useEffect(() => {
    const q = query(collection(db, 'sticky_notes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Handlers
  const handleAuthAction = async () => {
    if (user) {
      if (confirm("Are you sure you want to sign out?")) {
        await signOut(auth);
      }
    } else {
      setIsLoginOpen(true);
    }
  };

  const handleRefreshUser = async () => {
    // Helper to refresh user state (useful after clicking email verification link)
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
      alert("User profile refreshed.");
    }
  };

  const handleDeleteNote = async (id) => {
    if (!user) return;
    if (confirm("Are you sure you want to tear down this note?")) {
      try {
        const noteRef = doc(db, 'sticky_notes', id);
        const noteSnap = await getDoc(noteRef);
        
        if (noteSnap.exists()) {
          const noteData = noteSnap.data();
          
          if (noteData.userId !== user.uid) {
            alert("You can only delete your own notes.");
            return;
          }

          if (noteData.imageUrl) {
            try {
              const imageRef = ref(storage, noteData.imageUrl);
              await deleteObject(imageRef);
            } catch (storageErr) {
              console.warn("Could not delete image:", storageErr);
            }
          }
        }
        await deleteDoc(noteRef);
        
        if (selectedNote?.id === id) {
          setSelectedNote(null);
        }
      } catch (e) {
        console.error("Delete failed", e);
        alert("Delete failed. You might not be the owner.");
      }
    }
  };

  const handleFormSubmit = async (data) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    // CHECK: Email Verification
    await user.reload(); // Refresh token to ensure we have latest status
    if (!user.emailVerified) {
      alert("Your email is not verified. Please check your inbox and verify your email to post notes.");
      return;
    }
    
    try {
      let finalImageUrl = data.imageUrl;
      
      if (data.imageFile) {
        const fileName = `${Date.now()}_${data.imageFile.name}`;
        const storageRef = ref(storage, `sticky_note_images/${user.uid}/${fileName}`);
        const snapshot = await uploadBytes(storageRef, data.imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      // eslint-disable-next-line no-unused-vars
      const { imageFile, ...cleanData } = data;
      
      const noteData = {
        ...cleanData,
        imageUrl: finalImageUrl || ''
      };

      if (editingNote) {
        const docRef = doc(db, 'sticky_notes', editingNote.id);
        await updateDoc(docRef, noteData);
      } else {
        const now = new Date();
        const expiry = new Date(now.setDate(now.getDate() + 14));
        
        await addDoc(collection(db, 'sticky_notes'), {
          ...noteData,
          userId: user.uid, 
          userName: user.displayName || 'Anonymous', 
          createdAt: serverTimestamp(),
          expiresAt: expiry
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  const handlePinClick = async () => {
    if (!user) {
      setIsLoginOpen(true);
    } else {
      // Check verification on click
      await user.reload();
      if (!user.emailVerified) {
         alert("Action Required: Please verify your email address to post.");
      } else {
        setEditingNote(null);
        setIsFormOpen(true);
      }
    }
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const displayNotes = notes.filter(note => {
    const matchesSearch = !note.title ? false : (
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (note.description && note.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesTab = note.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoArea}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
               <div style={{ width: 10, height: 10, background: '#FFD700', borderRadius: '50%' }}></div>
               <div style={{ width: 10, height: 10, background: '#FF4081', borderRadius: '50%' }}></div>
               <div style={{ width: 10, height: 10, background: '#00B0FF', borderRadius: '50%' }}></div>
               <div style={{ width: 10, height: 10, background: '#00E676', borderRadius: '50%' }}></div>
            </div>
            <div>
              <h1 className={styles.brandName}>TTTEDDEL BOARD</h1>
              <p className={styles.tagline}>Community Notice & Services</p>
            </div>
          </div>

          <div className={styles.controls}>
             <div className={styles.searchBox}>
                <Search className={styles.searchIcon} size={18} />
                <input 
                  type="text" 
                  placeholder="Search current section..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
             </div>
             
             <button onClick={handlePinClick} className={styles.pinButton}>
                <Plus size={20} />
                <span>Pin Note</span>
             </button>

             {/* Auth Buttons */}
             <button 
                onClick={handleAuthAction}
                title={user ? `Signed in as ${user.email}` : "Sign In"}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
             >
                {user ? <User size={20} /> : <LogIn size={20} />}
                <span className="hidden md:inline" style={{ fontSize: '0.85rem' }}>
                  {user ? 'Sign Out' : 'Sign In'}
                </span>
             </button>
             
             {/* Show Refresh button only if logged in but not verified */}
             {user && !user.emailVerified && (
               <button 
                 onClick={handleRefreshUser}
                 title="I verified my email"
                 style={{
                   background: 'rgba(234, 179, 8, 0.2)',
                   border: '1px solid #eab308',
                   padding: '0.6rem',
                   borderRadius: '6px',
                   color: '#eab308',
                   cursor: 'pointer'
                 }}
               >
                 <RefreshCw size={18} />
               </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className={styles.mainCanvas}> 
        <div className={styles.categoryTabs}>
          {CATEGORIES.map((cat, index) => {
            const count = notes.filter(n => n.type === cat.id).length;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                style={{ 
                  '--tab-color': cat.color,
                  zIndex: isActive ? 20 : index 
                }} 
              >
                <span 
                  className={styles.tabDot}
                  style={{ 
                    backgroundColor: cat.color,
                    boxShadow: isActive ? `0 0 8px ${cat.color}` : 'none'
                  }} 
                />
                <span className={styles.tabLabel}>{cat.label}</span>
                <span className={styles.tabCount}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.boardContent}>
           {displayNotes.length === 0 ? (
              <div className={styles.emptyState}>
                 <Layers size={48} opacity={0.2} />
                 <p>No notes pinned in "{CATEGORIES.find(c => c.id === activeTab)?.label}" yet.</p>
                 <button 
                    onClick={handlePinClick}
                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                 >
                    {user ? "Be the first to pin one!" : "Sign in to post a note"}
                 </button>
              </div>
           ) : (
              <div className={styles.notesGrid}>
                {displayNotes.map(note => (
                  <StickyNote 
                    key={note.id} 
                    note={note} 
                    isOwner={user?.uid === note.userId}
                    onClick={() => setSelectedNote(note)}
                    onDelete={handleDeleteNote}
                    onEdit={openEditModal}
                  />
                ))}
              </div>
           )}
        </div>

        <div style={{
          textAlign: 'center',
          padding: '0.6rem 1.2rem',
          color: '#0f172a', 
          fontSize: '0.75rem',
          fontWeight: '800',
          marginTop: '-1rem', 
          marginBottom: '1rem',
          zIndex: 10,
          alignSelf: 'center', 
          backgroundColor: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(4px)', 
          borderRadius: '9999px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', 
          border: '1px solid rgba(255,255,255,0.5)',
          maxWidth: '90%', 
          width: 'fit-content'
        }}>
          Built by Ele InfoComm Technologies | web.e-ict.co.ke | info@e-ict.co.ke | +254 20 2000121
        </div>
      </main>

      {/* Modals */}
      <NoteFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingNote}
      />

      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <NoteDetailModal 
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
      />

    </div>
  );
}