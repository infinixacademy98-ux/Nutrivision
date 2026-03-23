import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { UserProfile, FoodLog, ActivityLog, Workout, SmartWatchLog } from '../types';
import { Plus, ChevronRight, Activity, Clock, Flame, Navigation, Sparkles, User } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  profile: UserProfile;
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  workouts: Workout[];
  smartWatchLogs: SmartWatchLog[];
  onAddFood: () => void;
  onLogActivity: (log: Omit<ActivityLog, 'uid'>) => void;
}

export default function Dashboard({ profile, foodLogs, activityLogs, workouts, smartWatchLogs, onAddFood, onLogActivity }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = foodLogs.filter(log => log.timestamp.startsWith(today));
  const todayActivities = activityLogs.filter(log => log.timestamp.startsWith(today));
  const todayWorkouts = workouts.filter(log => log.timestamp.startsWith(today));
  const todayWatch = smartWatchLogs.filter(log => log.timestamp.startsWith(today));

  const totals = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein: acc.protein + log.protein,
    fat: acc.fat + log.fat,
    carbs: acc.carbs + log.carbs,
    fiber: acc.fiber + log.fiber,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  const totalBurnedFromActivities = todayActivities.reduce((acc, log) => acc + log.caloriesBurned, 0);
  const totalBurnedFromWorkouts = todayWorkouts.reduce((acc, log) => acc + log.calories, 0);
  const totalBurnedFromWatch = todayWatch.reduce((acc, log) => acc + log.caloriesBurned, 0);
  const totalBurned = totalBurnedFromActivities + totalBurnedFromWorkouts + totalBurnedFromWatch;
  const totalDistance = todayWorkouts.reduce((acc, log) => acc + log.distance, 0) + 
                        todayWatch.reduce((acc, log) => acc + (log.distance || 0), 0);

  const calorieProgress = Math.min((totals.calories / profile.dailyCalorieGoal) * 100, 100);

  const getRecommendations = () => {
    const recs = [];
    if (totals.protein < profile.macroGoals.protein * 0.5) {
      recs.push("Try to increase your protein intake with lean meats, beans, or Greek yogurt.");
    }
    if (totals.fiber < profile.macroGoals.fiber * 0.5) {
      recs.push("You're low on fiber. Consider adding more vegetables, fruits, or whole grains.");
    }
    if (totals.calories > profile.dailyCalorieGoal * 0.9 && totals.calories < profile.dailyCalorieGoal) {
      recs.push("You're close to your calorie limit. Opt for high-volume, low-calorie snacks if you're still hungry.");
    }
    if (totalBurned < 200) {
      recs.push("A quick 15-minute walk could help boost your metabolism today!");
    }
    if (recs.length === 0) {
      recs.push("You're doing great! Keep up the balanced nutrition and activity.");
    }
    return recs;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Profile Header Card */}
      <div className="bg-brand-orange rounded-[2.5rem] p-8 text-white shadow-2xl shadow-brand-orange/30">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Hello, {profile.name}!</h2>
            <p className="text-white/70 font-medium">Ready for your workout?</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Weight</p>
            <p className="text-xl font-black">{profile.weight}<span className="text-xs ml-1 opacity-60">kg</span></p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Height</p>
            <p className="text-xl font-black">{profile.height}<span className="text-xs ml-1 opacity-60">cm</span></p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">BMI</p>
            <p className="text-xl font-black">{profile.bmi?.toFixed(1) || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* Calories Card */}
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-stone-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-4">
            <Flame className="w-5 h-5 text-brand-orange" />
          </div>
          <h3 className="text-stone-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Calories Consumed</h3>
          <p className="text-xl sm:text-2xl font-black text-brand-dark">{Math.round(totals.calories)}</p>
          <div className="mt-4 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${calorieProgress}%` }}
              className="h-full bg-brand-orange"
            />
          </div>
        </div>

        {/* Burned Card */}
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-stone-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-stone-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Burned</h3>
          <p className="text-xl sm:text-2xl font-black text-brand-dark">{Math.round(totalBurned)}</p>
          <p className="text-[10px] text-amber-600 font-bold mt-1">+{Math.round((totalBurned/500)*100)}% goal</p>
        </div>

        {/* Macros Card - Spans 2 columns */}
        <div className="col-span-2 bg-brand-dark rounded-[2.5rem] p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black tracking-tight">Daily Macros</h3>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-orange" />
              <div className="w-2 h-2 rounded-full bg-brand-green" />
              <div className="w-2 h-2 rounded-full bg-brand-blue" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Protein</p>
              <p className="text-xl font-black">{Math.round(totals.protein)}g</p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-orange" 
                  style={{ width: `${Math.min((totals.protein / profile.macroGoals.protein) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Carbs</p>
              <p className="text-xl font-black">{Math.round(totals.carbs)}g</p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-green" 
                  style={{ width: `${Math.min((totals.carbs / profile.macroGoals.carbs) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Fat</p>
              <p className="text-xl font-black">{Math.round(totals.fat)}g</p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-blue" 
                  style={{ width: `${Math.min((totals.fat / profile.macroGoals.fat) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-orange" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Smart Coach</h3>
        </div>
        <div className="space-y-4">
          {getRecommendations().map((rec, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8F9FB] border border-stone-100"
            >
              <div className="w-2 h-2 rounded-full bg-brand-orange mt-2 shrink-0" />
              <p className="text-stone-600 text-sm font-medium leading-relaxed">{rec}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Meals */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black tracking-tight">Today's Meals</h3>
          <button 
            onClick={onAddFood}
            className="w-10 h-10 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/20 active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        {todayLogs.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-4">No meals logged yet today.</p>
        ) : (
          <div className="space-y-4">
            {todayLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#F8F9FB] rounded-2xl border border-stone-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                    <span className="text-xl">🍽️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark text-sm">{log.name}</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-brand-orange">{log.calories} <span className="text-[10px] opacity-60">kcal</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
