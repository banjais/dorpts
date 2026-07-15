import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserActivity } from '../types';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Activity, Clock, Search, User } from 'lucide-react';

export const ActivityTracker: React.FC = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isSearching, setIsSearching] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const colPath = 'activities';
    const q = query(
      collection(db, colPath),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: UserActivity[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        list.push({
          id: doc.id,
          userId: d.userId,
          email: d.email,
          actionType: d.actionType,
          details: d.details,
          timestamp: d.timestamp?.seconds 
            ? new Date(d.timestamp.seconds * 1000).toISOString() 
            : d.timestamp || new Date().toISOString(),
        });
      });
      setActivities(list);
      setLoading(false);
    }, (error) => {
      // Graceful error logging as requested in skills
      try {
        handleFirestoreError(error, OperationType.GET, colPath);
      } catch (e) {
        console.error('Audit onSnapshot subscription failed:', e);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getActionStyle = (type: UserActivity['actionType']) => {
    switch (type) {
      case 'sync_sheets': return 'bg-sky-50 text-sky-700 border-sky-100/50';
      case 'edit_indicator': return 'bg-amber-50 text-amber-700 border-amber-100/50';
      case 'role_change': return 'bg-rose-50 text-rose-700 border-rose-100/50 font-bold';
      case 'login': return 'bg-emerald-50 text-emerald-700 border-emerald-100/50';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const filtered = activities.filter(act => {
    const matchesFilter = filterType === 'all' || act.actionType === filterType;
    const matchesSearch = act.email.toLowerCase().includes(isSearching.toLowerCase()) || 
                          act.details.toLowerCase().includes(isSearching.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" id="activity-metrics-logs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-indigo-600 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800 font-display">प्रयोगकर्ता गतिविधि र अडिट (User Metrics & Audit Logs)</h3>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 text-xs bg-slate-50 text-slate-600"
          >
            <option value="all">All Actions</option>
            <option value="login">Logins</option>
            <option value="edit_indicator">Edits Only</option>
            <option value="sync_sheets">Sheet Syncs</option>
            <option value="role_change">Role Escalations</option>
          </select>

          <input
            type="text"
            placeholder="Search email/details..."
            value={isSearching || ''}
            onChange={(e) => setIsSearching(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 text-xs placeholder:text-slate-400 max-w-[130px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400 animate-pulse font-sans">
          Loading audit metadata registers from Firestore...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 italic">
          No matching transaction trails discovered.
        </div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto overflow-x-auto custom-scroll pr-1">
          <table className="w-full text-left text-xs min-w-[500px] md:min-w-0">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-sans">
                <th className="pb-2 font-semibold">User (इमेल)</th>
                <th className="pb-2 font-semibold text-center">Action (कार्य)</th>
                <th className="pb-2 font-semibold">Details (विवरण)</th>
                <th className="pb-2 font-semibold text-right">Time (समय)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 relative">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((act) => (
                  <motion.tr 
                    key={act.id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2.5 pr-2 font-medium text-slate-700 whitespace-nowrap" title={act.email}>
                      {act.email}
                    </td>
                    <td className="py-2.5 text-center pr-2">
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getActionStyle(act.actionType)}`}>
                        {act.actionType}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600 pr-2 leading-snug">
                      {act.details}
                    </td>
                    <td className="py-2.5 text-right font-mono text-[10px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <div className="pt-3 border-t border-slate-50 mt-3 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Append-only secure log chain
        </span>
        <span className="font-semibold text-indigo-600 font-mono">
          {filtered.length} trails shown
        </span>
      </div>
    </div>
  );
};
