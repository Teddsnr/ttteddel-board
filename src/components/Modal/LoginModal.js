/**
 * File Name: LoginModal.js
 * Location: src/components/Modal/LoginModal.js
 * Purpose: Email/Password Authentication with Verification logic, Resend Timer, and Branding.
 * Fix: Corrected import path to '@/lib/firebase' (removing extra 'src').
 */
import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
// Fix: Use correct alias. '@' maps to 'src/', so we use '@/lib/firebase'
import { auth } from '@/lib/firebase'; 
import styles from './Modal.module.css';

const LoginModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  // Resend Timer State (in seconds)
  const [resendTimer, setResendTimer] = useState(0);
  const [userForResend, setUserForResend] = useState(null); 

  // Timer Countdown Logic
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleResendVerification = async () => {
    if (!userForResend || resendTimer > 0) return;
    
    try {
      await sendEmailVerification(userForResend);
      setInfo(`Verification email resent to ${userForResend.email}. Please check your spam folder.`);
      setResendTimer(240); // 4 minutes (240 seconds)
    } catch (err) {
      console.error("Resend failed:", err);
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please wait a while before trying again.");
      } else {
        setError("Failed to resend email.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP FLOW ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await sendEmailVerification(user);
        
        setUserForResend(user); 
        setResendTimer(240); // Start 4 min timer
        
        setInfo(`Account created! A verification link has been sent to ${email}.`);
      } else {
        // --- SIGN IN FLOW ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Force Email Verification Check
        if (!user.emailVerified) {
           setError("Email not verified yet.");
           setUserForResend(user);
           // If timer isn't running, let them resend immediately or keep existing timer
           setResendTimer(prev => (prev === 0 ? 0 : prev)); 
           return; 
        }

        onClose(); // Close modal on success
      }
    } catch (err) {
      console.error("Auth failed:", err);
      let msg = "Authentication failed.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div 
        className={styles.formContainer} 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '400px', textAlign: 'center' }}
      >
        <div className={styles.formHeader} style={{ justifyContent: 'center', position: 'relative' }}>
          <h2 className={styles.formTitle}>
            {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />} 
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose}
            style={{ position: 'absolute', right: '1rem' }}
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.formBody} style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* App Branding */}
          <div>
            <h1 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TTTEDDEL BOARD
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Community Notice & Services
            </p>
          </div>

          <p style={{ color: '#475569', fontSize: '0.9rem' }}>
            {isSignUp 
              ? "Join to post notes. We'll send you a verification link." 
              : "Sign in to manage your notes and post new ones."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
              <input 
                type="password" 
                placeholder="Password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          {/* Messages */}
          {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          
          {info && (
            <div style={{ background: '#dcfce7', padding: '0.75rem', borderRadius: '4px', textAlign: 'left' }}>
              <p style={{ color: '#166534', fontSize: '0.85rem', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                {info}
              </p>
              <p style={{ color: '#166534', fontSize: '0.8rem', margin: 0 }}>
                Did not receive it? Check your <strong>Spam folder</strong>.
              </p>
              {userForResend && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendTimer > 0}
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: resendTimer > 0 ? '#9ca3af' : '#15803d',
                    background: 'none',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: resendTimer > 0 ? 'default' : 'pointer',
                    padding: 0
                  }}
                >
                  {resendTimer > 0 
                    ? `Resend available in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}`
                    : "Resend Verification Email"
                  }
                </button>
              )}
            </div>
          )}

          {/* Toggle Login/Signup */}
          <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.5rem' }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setInfo(''); }}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </div>
          
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
             <p style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: '600' }}>
               Built by Ele InfoComm Technologies
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;