import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

const DAILY_AI_LIMIT = 15;

export const checkAndIncrementAiUsage = async (userId: string): Promise<{ allowed: boolean; remaining: number }> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return { allowed: false, remaining: 0 };
  }

  const profile = userSnap.data() as UserProfile;
  const today = new Date().toISOString().split('T')[0];
  
  let currentUsage = profile.aiUsage || { count: 0, lastResetDate: today };
  
  // Reset if it's a new day
  if (currentUsage.lastResetDate !== today) {
    currentUsage = { count: 0, lastResetDate: today };
  }

  if (currentUsage.count >= DAILY_AI_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  const newUsage = {
    count: currentUsage.count + 1,
    lastResetDate: today
  };

  await updateDoc(userRef, {
    aiUsage: newUsage
  });

  return { allowed: true, remaining: DAILY_AI_LIMIT - newUsage.count };
};

export const getAiUsage = async (userId: string): Promise<{ count: number; limit: number; remaining: number }> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return { count: 0, limit: DAILY_AI_LIMIT, remaining: DAILY_AI_LIMIT };
  }

  const profile = userSnap.data() as UserProfile;
  const today = new Date().toISOString().split('T')[0];
  
  let currentUsage = profile.aiUsage || { count: 0, lastResetDate: today };
  
  if (currentUsage.lastResetDate !== today) {
    return { count: 0, limit: DAILY_AI_LIMIT, remaining: DAILY_AI_LIMIT };
  }

  return { 
    count: currentUsage.count, 
    limit: DAILY_AI_LIMIT, 
    remaining: Math.max(0, DAILY_AI_LIMIT - currentUsage.count) 
  };
};
