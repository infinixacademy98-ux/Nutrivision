import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { UserProfile, WeightEntry, FoodLog, ActivityLog, Workout, UserAchievement, SmartWatchLog } from '../types';
import { Weight, Calendar, Plus, Flame, Navigation, Trophy, Footprints, Heart, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import Achievements from './Achievements';

interface ProgressProps {
  profile: UserProfile;
  weightHistory: WeightEntry[];
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  workouts: Workout[];
  smartWatchLogs: SmartWatchLog[];
  userAchievements: UserAchievement[];
  onAddWeight: (weight: number) => void;
}

export default function Progress({ profile, weightHistory, foodLogs, activityLogs, workouts, smartWatchLogs, userAchievements, onAddWeight }: ProgressProps) {
  const [newWeight, setNewWeight] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayWatchData = smartWatchLogs.filter(log => log.timestamp.startsWith(today));
  const todayWorkouts = workouts.filter(log => log.timestamp.startsWith(today));
  
  // Estimate steps from workouts: ~1312 steps per km (average for running/walking)
  const workoutSteps = todayWorkouts.reduce((sum, log) => sum + Math.round(log.distance * 1312), 0);
  const totalSteps = todayWatchData.reduce((sum, log) => sum + (log.steps || 0), 0) + workoutSteps;
  
  const totalDistance = todayWatchData.reduce((sum, log) => sum + (log.distance || 0), 0) + 
                        todayWorkouts.reduce((sum, log) => sum + log.distance, 0);
  
  const watchHeartRates = todayWatchData.filter(l => l.heartRate).map(l => l.heartRate as number);
  const avgHeartRate = watchHeartRates.length > 0 
    ? Math.round(watchHeartRates.reduce((sum, hr) => sum + hr, 0) / watchHeartRates.length) 
    : 0;
    
  const totalActiveMinutes = todayWatchData.reduce((sum, log) => sum + (log.activeMinutes || 0), 0) + 
                             todayWorkouts.reduce((sum, log) => sum + Math.round(log.duration / 60), 0);

  const weightData = weightHistory.map(entry => ({
    date: new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    weight: entry.weight
  })).slice(-7);

  // Calorie trend for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const calorieTrend = last7Days.map(date => {
    const dayLogs = foodLogs.filter(log => log.timestamp.startsWith(date));
    const dayActivities = activityLogs.filter(log => log.timestamp.startsWith(date));
    const dayWorkouts = workouts.filter(log => log.timestamp.startsWith(date));
    const dayWatch = smartWatchLogs.filter(log => log.timestamp.startsWith(date));
    
    const totalConsumed = dayLogs.reduce((acc, log) => acc + log.calories, 0);
    const totalBurnedFromActivities = dayActivities.reduce((acc, log) => acc + log.caloriesBurned, 0);
    const totalBurnedFromWorkouts = dayWorkouts.reduce((acc, log) => acc + log.calories, 0);
    const totalBurnedFromWatch = dayWatch.reduce((acc, log) => acc + log.caloriesBurned, 0);
    const totalBurned = totalBurnedFromActivities + totalBurnedFromWorkouts + totalBurnedFromWatch;
    const totalDist = dayWorkouts.reduce((acc, log) => acc + log.distance, 0) + dayWatch.reduce((acc, log) => acc + (log.distance || 0), 0);

    return {
      date: new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      consumed: totalConsumed,
      burned: totalBurned,
      distance: totalDist,
      net: totalConsumed - totalBurned,
      goal: profile.dailyCalorieGoal
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWeight) {
      onAddWeight(Number(newWeight));
      setNewWeight('');
    }
  };

  const stepGoal = 10000;
  const stepProgress = Math.min(totalSteps / stepGoal, 1);

  return (
    <div className="space-y-8 pb-8">
      {/* Circular Progress Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100 flex flex-col items-center">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              stroke="#F8F9FB"
              strokeWidth="20"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              stroke="#FF6321"
              strokeWidth="20"
              strokeDasharray="691"
              initial={{ strokeDashoffset: 691 }}
              animate={{ strokeDashoffset: 691 - (691 * stepProgress) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center mb-2">
              <Footprints className="w-10 h-10 text-brand-orange" />
            </div>
            <p className="text-3xl font-black text-brand-dark">{totalSteps.toLocaleString()}</p>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Steps Today</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-8 w-full mt-8 pt-8 border-t border-stone-50">
          <div className="text-center">
            <p className="text-brand-orange font-black text-lg">{totalDistance.toFixed(1)}<span className="text-[10px] ml-0.5 opacity-60">km</span></p>
            <p className="text-stone-400 text-[8px] font-bold uppercase tracking-widest">Distance</p>
          </div>
          <div className="text-center">
            <p className="text-brand-orange font-black text-lg">{avgHeartRate || '--'}<span className="text-[10px] ml-0.5 opacity-60">bpm</span></p>
            <p className="text-stone-400 text-[8px] font-bold uppercase tracking-widest">Heart Rate</p>
          </div>
          <div className="text-center">
            <p className="text-brand-orange font-black text-lg">{totalActiveMinutes}<span className="text-[10px] ml-0.5 opacity-60">min</span></p>
            <p className="text-stone-400 text-[8px] font-bold uppercase tracking-widest">Active</p>
          </div>
        </div>
      </div>

      {/* Weight History Chart */}
      <div className="bg-brand-dark rounded-[2.5rem] p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black tracking-tight">Weight History</h3>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="kg"
              className="w-16 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
            <button
              type="submit"
              className="bg-brand-orange text-white p-2 rounded-xl active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6321" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#FF6321" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calorie Trend */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100">
        <h3 className="text-xl font-black tracking-tight text-brand-dark mb-8">Calorie Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calorieTrend}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: '#F8F9FB' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="consumed" fill="#FF6321" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="burned" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements System */}
      <Achievements userAchievements={userAchievements} />
    </div>
  );
}
