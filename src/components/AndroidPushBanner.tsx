import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { InAppNotification, notificationService } from '../utils/notificationService';

export const AndroidPushBanner: React.FC = () => {
  const [notification, setNotification] = useState<InAppNotification | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((item) => {
      setNotification(item);
      const timer = setTimeout(() => {
        setNotification((curr) => (curr?.id === item.id ? null : curr));
      }, 5500);
      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!notification) return null;

  return (
    <div className="absolute top-12 left-4 right-4 z-50 animate-in slide-in-from-top-6 duration-300 pointer-events-auto">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/50 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shrink-0 text-lg shadow-md">
          {notification.icon || <Bell className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase font-game">
              ApexQuest Alert
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{notification.timestamp}</span>
          </div>
          <h4 className="text-sm font-semibold text-white leading-tight truncate">{notification.title}</h4>
          <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{notification.body}</p>
        </div>
        <button
          onClick={() => setNotification(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
