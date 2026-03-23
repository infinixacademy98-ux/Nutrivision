import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Ruler, Weight, Activity, Target } from 'lucide-react';

interface ProfileFormProps {
  initialProfile?: UserProfile;
  onSubmit: (profile: UserProfile) => void;
}

export default function ProfileForm({ initialProfile, onSubmit }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(initialProfile || {
    name: '',
    age: 25,
    gender: 'male',
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintenance',
  });

  const calculateNutrition = (data: Partial<UserProfile>) => {
    const { age, gender, height, weight, activityLevel, goal } = data;
    if (!age || !gender || !height || !weight || !activityLevel || !goal) return null;

    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    const activityMultipliers = {
      sedentary: 1.2,
      moderate: 1.55,
      active: 1.9,
    };

    let tdee = bmr * activityMultipliers[activityLevel];

    if (goal === 'weight_loss') tdee -= 500;
    if (goal === 'weight_gain') tdee += 500;

    const dailyCalorieGoal = Math.round(tdee);
    
    // BMI calculation
    const bmi = Number((weight / ((height / 100) ** 2)).toFixed(1));

    // Macro split
    const protein = Math.round(weight * 1.8); // 1.8g per kg
    const fat = Math.round((dailyCalorieGoal * 0.25) / 9); // 25% of calories
    const carbs = Math.round((dailyCalorieGoal - (protein * 4 + fat * 9)) / 4);
    const fiber = 30; // Standard goal

    return { dailyCalorieGoal, bmi, macroGoals: { protein, fat, carbs, fiber } };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nutrition = calculateNutrition(formData);
    if (nutrition) {
      onSubmit({ ...formData as UserProfile, ...nutrition });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
      <h2 className="text-2xl font-bold text-stone-900 mb-6">Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
              placeholder="Enter your name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Age</label>
            <input
              type="number"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Height (cm)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
              <input
                type="number"
                required
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Weight (kg)</label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
              <input
                type="number"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Activity Level</label>
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
            <select
              value={formData.activityLevel}
              onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            >
              <option value="sedentary">Sedentary (Office job)</option>
              <option value="moderate">Moderate (Exercise 3-5x/week)</option>
              <option value="active">Active (Physical job/daily exercise)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Your Goal</label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="maintenance">Maintenance</option>
              <option value="weight_gain">Weight Gain</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-orange text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-orange/20 hover:bg-brand-orange/90 transition-all mt-4 active:scale-95"
        >
          SAVE PROFILE
        </button>
      </form>
    </div>
  );
}
