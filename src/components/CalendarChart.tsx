import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Flame, Navigation, Utensils } from 'lucide-react';
import { FoodLog, ActivityLog, Workout } from '../types';

interface CalendarChartProps {
  isOpen: boolean;
  onClose: () => void;
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  workouts: Workout[];
}

export default function CalendarChart({ isOpen, onClose, foodLogs, activityLogs, workouts }: CalendarChartProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const getDayData = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    
    const dayFood = foodLogs.filter(log => log.timestamp.startsWith(dateStr));
    const dayActivity = activityLogs.filter(log => log.timestamp.startsWith(dateStr));
    const dayWorkouts = workouts.filter(log => log.timestamp.startsWith(dateStr));

    const intake = dayFood.reduce((sum, log) => sum + log.calories, 0);
    const burned = dayActivity.reduce((sum, log) => sum + log.caloriesBurned, 0) + 
                   dayWorkouts.reduce((sum, log) => sum + log.calories, 0);
    const distance = dayWorkouts.reduce((sum, log) => sum + log.distance, 0);
    const hasWorkout = dayActivity.length > 0 || dayWorkouts.length > 0;

    return { intake, burned, distance, hasWorkout };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Selected Day Popup */}
          <AnimatePresence>
            {selectedDay !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-white/80 backdrop-blur-md"
                onClick={() => setSelectedDay(null)}
              >
                <div className="bg-brand-dark text-white p-8 rounded-[2rem] shadow-2xl w-full max-w-[280px] relative">
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="text-center mb-6">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                      {monthNames[month]} {selectedDay}, {year}
                    </p>
                    <h3 className="text-2xl font-black tracking-tight">Daily Progress</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <Utensils className="w-4 h-4 text-brand-orange" />
                        <span className="text-xs font-bold text-white/60">C. Consumed</span>
                      </div>
                      <span className="font-black">{Math.round(getDayData(selectedDay).intake)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-white/60">C. Burned</span>
                      </div>
                      <span className="font-black">{Math.round(getDayData(selectedDay).burned)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <Navigation className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-white/60">Distance</span>
                      </div>
                      <span className="font-black">{getDayData(selectedDay).distance.toFixed(1)}km</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black tracking-tight">
                {monthNames[month]} <span className="text-brand-orange">{year}</span>
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={`${day}-${idx}`} className="text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const data = getDayData(day);
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                return (
                  <button 
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative group transition-all hover:scale-105 active:scale-95 ${
                      data.hasWorkout 
                        ? 'bg-brand-orange/5 border border-brand-orange/10' 
                        : 'bg-rose-50 border border-rose-100'
                    } ${isToday ? 'ring-2 ring-brand-orange ring-offset-2' : ''}`}
                  >
                    <span className={`text-xs font-black ${data.hasWorkout ? 'text-brand-dark' : 'text-rose-600'}`}>
                      {day}
                    </span>
                    
                    <div className="flex gap-0.5 mt-1">
                      {data.intake > 0 && <div className="w-1 h-1 rounded-full bg-brand-orange" />}
                      {data.burned > 0 && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                      {data.distance > 0 && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-6 p-4 bg-stone-50 rounded-3xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-orange/20 border border-brand-orange/30" />
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-50 border border-rose-100" />
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Rest Day</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
