import { FoodLog, ActivityLog, Workout, UserAchievement, Achievement } from '../types';
import { db, collection, addDoc, query, where, getDocs } from '../firebase';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_run', title: 'First Run', description: 'Complete your first tracked run', icon: 'Navigation', category: 'fitness', requirement: 1 },
  { id: 'run_5k', title: '5K Finisher', description: 'Run a total of 5km', icon: 'Trophy', category: 'fitness', requirement: 5 },
  { id: 'run_10k', title: '10K Master', description: 'Run a total of 10km', icon: 'Medal', category: 'fitness', requirement: 10 },
  { id: 'consistency_3', title: '3 Day Streak', description: 'Log food for 3 consecutive days', icon: 'Flame', category: 'consistency', requirement: 3 },
  { id: 'consistency_7', title: 'Week Warrior', description: 'Log food for 7 consecutive days', icon: 'Star', category: 'consistency', requirement: 7 },
  { id: 'calorie_goal', title: 'Goal Crusher', description: 'Hit your calorie goal 5 times', icon: 'Target', category: 'nutrition', requirement: 5 },
  { id: 'workout_pro', title: 'Workout Pro', description: 'Complete 10 workouts', icon: 'Zap', category: 'fitness', requirement: 10 },
];

export async function checkAchievements(
  uid: string,
  foodLogs: FoodLog[],
  activityLogs: ActivityLog[],
  workouts: Workout[],
  existingAchievements: UserAchievement[]
): Promise<UserAchievement[]> {
  const newAchievements: UserAchievement[] = [];
  const existingIds = new Set(existingAchievements.map(ua => ua.achievementId));

  const totalRunDistance = workouts.filter(w => w.type === 'run').reduce((sum, w) => sum + w.distance, 0);
  const totalWorkouts = workouts.length + activityLogs.length;

  // 1. First Run
  if (!existingIds.has('first_run') && workouts.some(w => w.type === 'run')) {
    newAchievements.push({ uid, achievementId: 'first_run', unlockedAt: new Date().toISOString() });
  }

  // 2. Run 5K
  if (!existingIds.has('run_5k') && totalRunDistance >= 5) {
    newAchievements.push({ uid, achievementId: 'run_5k', unlockedAt: new Date().toISOString() });
  }

  // 3. Run 10K
  if (!existingIds.has('run_10k') && totalRunDistance >= 10) {
    newAchievements.push({ uid, achievementId: 'run_10k', unlockedAt: new Date().toISOString() });
  }

  // 4. Workout Pro
  if (!existingIds.has('workout_pro') && totalWorkouts >= 10) {
    newAchievements.push({ uid, achievementId: 'workout_pro', unlockedAt: new Date().toISOString() });
  }

  // 5. Consistency (3 days)
  if (!existingIds.has('consistency_3')) {
    const dates = new Set(foodLogs.map(l => l.timestamp.split('T')[0]));
    if (dates.size >= 3) {
      newAchievements.push({ uid, achievementId: 'consistency_3', unlockedAt: new Date().toISOString() });
    }
  }

  // 6. Consistency (7 days)
  if (!existingIds.has('consistency_7')) {
    const dates = new Set(foodLogs.map(l => l.timestamp.split('T')[0]));
    if (dates.size >= 7) {
      newAchievements.push({ uid, achievementId: 'consistency_7', unlockedAt: new Date().toISOString() });
    }
  }

  // Save new achievements to Firestore
  for (const achievement of newAchievements) {
    try {
      await addDoc(collection(db, 'users', uid, 'achievements'), achievement);
    } catch (err) {
      console.error("Failed to save achievement:", err);
    }
  }

  return newAchievements;
}
