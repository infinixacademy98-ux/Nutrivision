import React, { useState } from 'react';
import { Activity, Flame, Heart, Navigation, Footprints, Clock, Check, X } from 'lucide-react';
import { SmartWatchLog } from '../types';
import { motion } from 'motion/react';

interface SmartWatchEntryProps {
  onSave: (log: Omit<SmartWatchLog, 'uid'>) => void;
  onCancel: () => void;
}

export default function SmartWatchEntry({ onSave, onCancel }: SmartWatchEntryProps) {
  const [formData, setFormData] = useState({
    steps: '',
    distance: '',
    caloriesBurned: '',
    heartRate: '',
    activeMinutes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caloriesBurned) return;

    onSave({
      steps: formData.steps ? Number(formData.steps) : undefined,
      distance: formData.distance ? Number(formData.distance) : undefined,
      caloriesBurned: Number(formData.caloriesBurned),
      heartRate: formData.heartRate ? Number(formData.heartRate) : undefined,
      activeMinutes: formData.activeMinutes ? Number(formData.activeMinutes) : undefined,
      timestamp: new Date().toISOString(),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-brand-dark tracking-tight">Smart Watch Data</h2>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Manual Entry</p>
        </div>
        <button 
          onClick={onCancel}
          className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calories Burned (Required) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Flame className="w-3 h-3 text-brand-orange" />
              Calories Burned *
            </label>
            <input
              required
              type="number"
              name="caloriesBurned"
              value={formData.caloriesBurned}
              onChange={handleChange}
              placeholder="e.g. 350"
              className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>

          {/* Heart Rate */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Heart className="w-3 h-3 text-rose-500" />
              Avg Heart Rate
            </label>
            <input
              type="number"
              name="heartRate"
              value={formData.heartRate}
              onChange={handleChange}
              placeholder="e.g. 125 bpm"
              className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Footprints className="w-3 h-3 text-emerald-500" />
              Steps
            </label>
            <input
              type="number"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              placeholder="e.g. 10000"
              className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Navigation className="w-3 h-3 text-blue-500" />
              Distance (km)
            </label>
            <input
              type="number"
              step="0.01"
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              placeholder="e.g. 5.2"
              className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>

          {/* Active Minutes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3 text-amber-500" />
              Active Minutes
            </label>
            <input
              type="number"
              name="activeMinutes"
              value={formData.activeMinutes}
              onChange={handleChange}
              placeholder="e.g. 45"
              className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-brand-dark text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95"
          >
            <Check className="w-6 h-6" />
            SAVE WATCH DATA
          </button>
        </div>
      </form>
    </motion.div>
  );
}
