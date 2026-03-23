import React from 'react';
import { Trophy, Medal, Star, Target, Zap, Flame, Navigation, Utensils } from 'lucide-react';
import { Achievement, UserAchievement } from '../types';
import { motion } from 'motion/react';

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_run', title: 'First Run', description: 'Complete your first tracked run', icon: 'Navigation', category: 'fitness', requirement: 1 },
  { id: 'run_5k', title: '5K Finisher', description: 'Run a total of 5km', icon: 'Trophy', category: 'fitness', requirement: 5 },
  { id: 'run_10k', title: '10K Master', description: 'Run a total of 10km', icon: 'Medal', category: 'fitness', requirement: 10 },
  { id: 'consistency_3', title: '3 Day Streak', description: 'Log food for 3 consecutive days', icon: 'Flame', category: 'consistency', requirement: 3 },
  { id: 'consistency_7', title: 'Week Warrior', description: 'Log food for 7 consecutive days', icon: 'Star', category: 'consistency', requirement: 7 },
  { id: 'calorie_goal', title: 'Goal Crusher', description: 'Hit your calorie goal 5 times', icon: 'Target', category: 'nutrition', requirement: 5 },
  { id: 'workout_pro', title: 'Workout Pro', description: 'Complete 10 workouts', icon: 'Zap', category: 'fitness', requirement: 10 },
];

const IconMap: Record<string, any> = {
  Trophy, Medal, Star, Target, Zap, Flame, Navigation, Utensils
};

interface AchievementsProps {
  userAchievements: UserAchievement[];
}

export default function Achievements({ userAchievements }: AchievementsProps) {
  const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight">Achievements</h2>
        <div className="bg-brand-orange/10 px-3 py-1 rounded-full">
          <span className="text-xs font-bold text-brand-orange uppercase tracking-widest">
            {unlockedIds.size} / {ALL_ACHIEVEMENTS.length} Unlocked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ALL_ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const Icon = IconMap[achievement.icon] || Trophy;

          return (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.02 }}
              className={`p-5 rounded-[2rem] border transition-all relative overflow-hidden ${
                isUnlocked 
                  ? 'bg-white border-stone-100 shadow-sm' 
                  : 'bg-stone-50 border-stone-100 opacity-60 grayscale'
              }`}
            >
              {isUnlocked && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-orange/5 rounded-full -mr-6 -mt-6" />
              )}
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                isUnlocked ? 'bg-brand-orange/10' : 'bg-stone-200'
              }`}>
                <Icon className={`w-6 h-6 ${isUnlocked ? 'text-brand-orange' : 'text-stone-400'}`} />
              </div>

              <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-brand-dark' : 'text-stone-500'}`}>
                {achievement.title}
              </h3>
              <p className="text-[10px] text-stone-400 leading-tight">
                {achievement.description}
              </p>

              {isUnlocked && (
                <div className="mt-3 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                  <span className="text-[8px] font-black text-brand-orange uppercase tracking-widest">Unlocked</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
