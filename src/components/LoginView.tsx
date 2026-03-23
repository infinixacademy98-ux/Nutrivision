import React, { useState } from 'react';
import { LogIn, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from '../firebase';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isSignUp = mode === 'signup';
  const isReset = mode === 'reset';

  const getErrorMessage = (error: any) => {
    const code = error?.code;
    switch (code) {
      case 'auth/email-already-in-use':
        return "This email is already registered. Please log in instead.";
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return "Invalid email or password. Please check your credentials and try again.";
      case 'auth/weak-password':
        return "Password is too weak. Please use at least 6 characters.";
      case 'auth/invalid-email':
        return "Please enter a valid email address.";
      case 'auth/too-many-requests':
        return "Too many failed attempts. Please try again later.";
      case 'auth/popup-closed-by-user':
        return "Sign-in window was closed. Please try again.";
      default:
        return error?.message || "Authentication failed. Please try again.";
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-orange flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <img 
          src="https://i.ibb.co/x8dG9764/Nutri-Vision-AI-logo-design.png" 
          alt="NutriVision AI Logo" 
          className="w-24 h-24 object-contain mb-6"
          referrerPolicy="no-referrer"
        />
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase">
            {isReset ? 'RESET PASSWORD' : isSignUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
          </h1>
          <p className="text-white/70 text-sm font-medium">
            {isReset ? 'Enter your email to receive a reset link' : isSignUp ? 'Start your fitness journey today' : 'Log in to continue your progress'}
          </p>
        </div>

        <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-black/20 text-stone-800">
          <form onSubmit={isReset ? (e) => { e.preventDefault(); handleForgotPassword(); } : handleEmailAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                    <input
                      type="text"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {!isReset && (
              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-[10px] font-bold text-brand-orange hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-600 text-xs">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-orange/20 hover:bg-brand-orange/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isReset ? 'SEND RESET LINK' : isSignUp ? 'CREATE ACCOUNT' : 'LOG IN'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {isReset && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-stone-400 text-xs font-bold uppercase tracking-widest hover:text-stone-600 transition-all py-2"
              >
                Back to Login
              </button>
            )}

            {!isReset && (
              <>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="bg-white px-4 text-stone-300">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-stone-50 border border-stone-100 text-stone-600 font-bold py-4 rounded-2xl hover:bg-stone-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  Google
                </button>
              </>
            )}
          </form>

          {!isReset && (
            <p className="text-center mt-8 text-stone-400 text-xs font-medium">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => setMode(isSignUp ? 'login' : 'signup')}
                className="text-brand-orange font-bold hover:underline"
              >
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
