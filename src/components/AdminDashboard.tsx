import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Users, Shield, Activity, AlertCircle, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Admin Dashboard Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAiRequests = users.reduce((acc, u) => acc + (u.aiUsage?.count || 0), 0);
  const activeUsersToday = users.filter(u => (u.aiUsage?.count || 0) > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-orange" />
            Admin Control
          </h2>
          <p className="text-stone-500 text-sm">Monitor system usage and user activity</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-orange" />
            </div>
            <span className="text-stone-500 text-sm font-medium">Total Users</span>
          </div>
          <p className="text-3xl font-black text-stone-900">{users.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-stone-500 text-sm font-medium">Active Today</span>
          </div>
          <p className="text-3xl font-black text-stone-900">{activeUsersToday}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-stone-500 text-sm font-medium">AI Requests Today</span>
          </div>
          <p className="text-3xl font-black text-stone-900">{totalAiRequests}</p>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search users by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">AI Usage (Today)</th>
                <th className="px-6 py-4">Goal</th>
                <th className="px-6 py-4">BMI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-stone-900">{u.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{u.uid}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className={`h-full transition-all ${
                            (u.aiUsage?.count || 0) > 10 ? 'bg-red-500' : 'bg-brand-orange'
                          }`}
                          style={{ width: `${Math.min(100, ((u.aiUsage?.count || 0) / 15) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-stone-700">{u.aiUsage?.count || 0}/15</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-stone-600 capitalize">{u.goal.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-stone-900">{u.bmi.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400">No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
