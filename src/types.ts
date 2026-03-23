export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'moderate' | 'active';
  goal: 'weight_loss' | 'maintenance' | 'weight_gain';
  dailyCalorieGoal: number;
  bmi: number;
  role: 'user' | 'admin';
  aiUsage?: {
    count: number;
    lastResetDate: string;
  };
  macroGoals: {
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
}

export interface FoodLog {
  id?: string;
  uid: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  timestamp: string;
  portionSize?: string;
}

export interface WeightEntry {
  id?: string;
  uid: string;
  weight: number;
  timestamp: string;
}

export interface ActivityLog {
  id?: string;
  uid: string;
  name: string;
  caloriesBurned: number;
  duration?: number;
  timestamp: string;
}

export interface Workout {
  id?: string;
  uid: string;
  type: 'run' | 'walk';
  distance: number;
  duration: number;
  calories: number;
  pace: number;
  route: { lat: number; lng: number }[];
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'fitness' | 'nutrition' | 'consistency';
  requirement: number;
}

export interface UserAchievement {
  id?: string;
  uid: string;
  achievementId: string;
  unlockedAt: string;
}

export interface SmartWatchLog {
  id?: string;
  uid: string;
  steps?: number;
  distance?: number;
  caloriesBurned: number;
  heartRate?: number;
  activeMinutes?: number;
  timestamp: string;
}
