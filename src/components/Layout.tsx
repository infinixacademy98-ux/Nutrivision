import React from 'react';
import { Home, Camera, MessageSquare, User, TrendingUp, Navigation, Calendar, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCalendarClick?: () => void;
  isAdmin?: boolean;
}

export default function Layout({ children, activeTab, setActiveTab, onCalendarClick, isAdmin }: LayoutProps) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'tracker', icon: Navigation, label: 'Run' },
    { id: 'scanner', icon: Camera, label: 'Scan' },
    { id: 'coach', icon: MessageSquare, label: 'Coach' },
    { id: 'progress', icon: TrendingUp, label: 'Progress' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    // Insert admin tab before profile
    tabs.splice(tabs.length - 1, 0, { id: 'admin', icon: Shield, label: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-brand-dark font-sans pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://i.ibb.co/x8dG9764/Nutri-Vision-AI-logo-design.png" 
              alt="Logo" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-2xl font-black tracking-tighter text-brand-orange">NUTRI<span className="text-brand-dark">VISION</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onCalendarClick}
              className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center transition-transform active:scale-90"
            >
              <Calendar className="w-5 h-5 text-brand-orange" />
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center transition-transform active:scale-90"
            >
              <User className="w-5 h-5 text-brand-orange" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          {children}
        </motion.div>
        <footer className="mt-12 mb-8 text-center">
          <p className="text-stone-400 text-xs font-medium tracking-wider uppercase">Created by Infinix Academy</p>
        </footer>
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-brand-dark rounded-[2.5rem] px-4 py-3 z-50 shadow-2xl shadow-black/20 max-w-md mx-auto">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative p-3 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id ? 'bg-brand-orange text-white scale-110' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              {activeTab === tab.id && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-brand-orange rounded-2xl blur-md -z-10 opacity-50"
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
