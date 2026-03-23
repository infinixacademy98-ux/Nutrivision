import React, { useState, useEffect } from 'react';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, 
  doc, getDoc, setDoc, collection, addDoc, onSnapshot, query, orderBy, limit, getDocFromServer 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile, FoodLog, WeightEntry, ActivityLog, Workout, UserAchievement, SmartWatchLog } from './types';
import { checkAchievements } from './services/achievementService';
import { cleanupOldData } from './services/dataCleanup';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProfileForm from './components/ProfileForm';
import FoodScanner from './components/FoodScanner';
import Progress from './components/Progress';
import Coach from './components/Coach';
import RunTracker from './components/RunTracker';
import SmartWatchEntry from './components/SmartWatchEntry';
import CalendarChart from './components/CalendarChart';
import AdminDashboard from './components/AdminDashboard';
import LoginView from './components/LoginView';
import { LogIn, Loader2, AlertCircle, Download } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [smartWatchLogs, setSmartWatchLogs] = useState<SmartWatchLog[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleFirestoreError = (err: any, operation: string, path: string) => {
    const errInfo = {
      error: err.message || String(err),
      operationType: operation,
      path: path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    setError(`Database error: ${err.message}`);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setProfile(null);
        setFoodLogs([]);
        setWeightHistory([]);
        setActivityLogs([]);
        setWorkouts([]);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch Profile
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, 'get', `users/${user.uid}`);
      setLoading(false);
    });

    // Fetch Food Logs
    const logsPath = `users/${user.uid}/foodLogs`;
    const logsQuery = query(
      collection(db, logsPath),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodLog));
      setFoodLogs(logs);
    }, (err) => {
      handleFirestoreError(err, 'list', logsPath);
    });

    // Fetch Weight History
    const weightPath = `users/${user.uid}/weightHistory`;
    const weightQuery = query(
      collection(db, weightPath),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    const unsubWeight = onSnapshot(weightQuery, (snap) => {
      const history = snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry));
      setWeightHistory(history.reverse());
    }, (err) => {
      handleFirestoreError(err, 'list', weightPath);
    });

    // Fetch Activity Logs
    const activityPath = `users/${user.uid}/activityLogs`;
    const activityQuery = query(
      collection(db, activityPath),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubActivity = onSnapshot(activityQuery, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog));
      setActivityLogs(logs);
    }, (err) => {
      handleFirestoreError(err, 'list', activityPath);
    });

    // Fetch Workouts
    const workoutsPath = `users/${user.uid}/workouts`;
    const workoutsQuery = query(
      collection(db, workoutsPath),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubWorkouts = onSnapshot(workoutsQuery, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Workout));
      setWorkouts(logs);
    }, (err) => {
      handleFirestoreError(err, 'list', workoutsPath);
    });

    // Fetch Achievements
    const achievementsPath = `users/${user.uid}/achievements`;
    const achievementsQuery = query(
      collection(db, achievementsPath),
      orderBy('unlockedAt', 'desc')
    );
    const unsubAchievements = onSnapshot(achievementsQuery, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserAchievement));
      setUserAchievements(logs);
    }, (err) => {
      handleFirestoreError(err, 'list', achievementsPath);
    });

    // Fetch Smart Watch Logs
    const watchPath = `users/${user.uid}/smartWatchLogs`;
    const watchQuery = query(
      collection(db, watchPath),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubWatch = onSnapshot(watchQuery, (snap) => {
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SmartWatchLog));
      setSmartWatchLogs(logs);
    }, (err) => {
      handleFirestoreError(err, 'list', watchPath);
    });

    return () => {
      unsubProfile();
      unsubLogs();
      unsubWeight();
      unsubActivity();
      unsubWorkouts();
      unsubAchievements();
      unsubWatch();
    };
  }, [user]);

  // Data Cleanup
  useEffect(() => {
    if (!user) return;
    cleanupOldData(user.uid);
  }, [user]);

  // Check for new achievements
  useEffect(() => {
    if (!user || loading) return;
    
    const timer = setTimeout(() => {
      checkAchievements(user.uid, foodLogs, activityLogs, workouts, userAchievements)
        .then(newAchievements => {
          if (newAchievements.length > 0) {
            console.log("New achievements unlocked!", newAchievements);
          }
        });
    }, 2000); // Debounce check

    return () => clearTimeout(timer);
  }, [foodLogs, activityLogs, workouts, user]);

  const handleSaveProfile = async (newProfile: UserProfile) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    // Force admin role for the specific email, otherwise keep current role or default to user
    const role = user.email === 'infinixacademy98@gmail.com' ? 'admin' : (profile?.role || 'user');
    try {
      await setDoc(doc(db, path), { ...newProfile, uid: user.uid, role });
      // Also log initial weight if history is empty
      if (weightHistory.length === 0) {
        await handleAddWeight(newProfile.weight);
      }
    } catch (err) {
      handleFirestoreError(err, 'write', path);
    }
  };

  const handleLogFood = async (log: FoodLog) => {
    if (!user) return;
    const path = `users/${user.uid}/foodLogs`;
    try {
      await addDoc(collection(db, path), log);
      setActiveTab('dashboard');
    } catch (err) {
      handleFirestoreError(err, 'write', path);
    }
  };

  const handleLogActivity = async (log: Omit<ActivityLog, 'uid'>) => {
    if (!user) return;
    const path = `users/${user.uid}/activityLogs`;
    try {
      await addDoc(collection(db, path), { ...log, uid: user.uid });
      setActiveTab('dashboard');
    } catch (err) {
      handleFirestoreError(err, 'write', path);
    }
  };

  const handleSaveWorkout = async (workout: Omit<Workout, 'uid'>) => {
    if (!user) return;
    const path = `users/${user.uid}/workouts`;
    try {
      await addDoc(collection(db, path), { ...workout, uid: user.uid });
      setActiveTab('dashboard');
    } catch (err) {
      handleFirestoreError(err, 'write', path);
    }
  };

  const handleAddWeight = async (weight: number) => {
    if (!user) return;
    const path = `users/${user.uid}/weightHistory`;
    try {
      await addDoc(collection(db, path), {
        uid: user.uid,
        weight,
        timestamp: new Date().toISOString()
      });
      // Also update current weight in profile
      if (profile) {
        await setDoc(doc(db, 'users', user.uid), { ...profile, weight }, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, 'write', path);
    }
  };

  const handleLogSmartWatch = async (log: Omit<SmartWatchLog, 'uid'>) => {
    if (!user) return;
    const path = `users/${user.uid}/smartWatchLogs`;
    try {
      await addDoc(collection(db, path), { ...log, uid: user.uid });
      setActiveTab('dashboard');
    } catch (err) {
      handleFirestoreError(err, 'write', path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <img 
            src="https://i.ibb.co/x8dG9764/Nutri-Vision-AI-logo-design.png" 
            alt="NutriVision AI Logo" 
            className="w-32 h-32 object-contain"
            referrerPolicy="no-referrer"
          />
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-8">Created by Infinix Academy</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={() => setLoading(true)} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-stone-900 mb-2">Welcome!</h1>
            <p className="text-stone-500">Let's set up your nutrition profile to get started.</p>
          </div>
          <ProfileForm onSubmit={handleSaveProfile} />
          <footer className="mt-12 mb-8 text-center">
            <p className="text-stone-400 text-xs font-medium tracking-wider uppercase">Created by Infinix Academy</p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onCalendarClick={() => setShowCalendar(true)}
      isAdmin={profile?.role === 'admin' || user?.email === 'infinixacademy98@gmail.com'}
    >
      {error && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto font-bold underline">Dismiss</button>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <Dashboard 
          profile={profile} 
          foodLogs={foodLogs} 
          activityLogs={activityLogs}
          workouts={workouts}
          smartWatchLogs={smartWatchLogs}
          onAddFood={() => setActiveTab('scanner')} 
          onLogActivity={handleLogActivity}
        />
      )}
      {activeTab === 'tracker' && (
        <RunTracker 
          profile={profile} 
          onSaveWorkout={handleSaveWorkout} 
          onOpenWatchEntry={() => setActiveTab('watch')}
        />
      )}
      {activeTab === 'watch' && (
        <SmartWatchEntry 
          onSave={handleLogSmartWatch}
          onCancel={() => setActiveTab('tracker')}
        />
      )}
      {activeTab === 'scanner' && (
        <FoodScanner 
          profile={profile} 
          onLogFood={handleLogFood} 
        />
      )}
      {activeTab === 'coach' && (
        <Coach />
      )}
      {activeTab === 'admin' && (profile?.role === 'admin' || user?.email === 'infinixacademy98@gmail.com') && (
        <AdminDashboard />
      )}
      {activeTab === 'progress' && (
        <Progress 
          profile={profile} 
          weightHistory={weightHistory} 
          foodLogs={foodLogs} 
          activityLogs={activityLogs}
          workouts={workouts}
          smartWatchLogs={smartWatchLogs}
          userAchievements={userAchievements}
          onAddWeight={handleAddWeight} 
        />
      )}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <ProfileForm initialProfile={profile} onSubmit={handleSaveProfile} />
          <div className="space-y-3">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full bg-brand-orange text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2 hover:bg-brand-orange/90 transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                Install App
              </button>
            )}
            <button
              onClick={() => signOut(auth)}
              className="w-full bg-stone-100 text-stone-600 font-bold py-4 rounded-2xl hover:bg-stone-200 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <CalendarChart 
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        foodLogs={foodLogs}
        activityLogs={activityLogs}
        workouts={workouts}
      />
    </Layout>
  );
}
