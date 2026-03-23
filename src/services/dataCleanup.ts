import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { FoodLog } from '../types';

export const cleanupOldData = async (userId: string) => {
  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  const foodLogsPath = `users/${userId}/foodLogs`;
  const foodLogsRef = collection(db, foodLogsPath);

  try {
    const snapshot = await getDocs(foodLogsRef);
    
    for (const d of snapshot.docs) {
      const data = d.data() as any; // Use any since imageUrl is gone from type
      const timestamp = new Date(data.timestamp);

      // Delete logs older than 10 days
      if (timestamp < tenDaysAgo) {
        await deleteDoc(doc(db, foodLogsPath, d.id));
        continue;
      }
    }
  } catch (error) {
    console.error("Error during data cleanup:", error);
  }
};
