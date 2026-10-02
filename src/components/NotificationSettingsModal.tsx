import React, { useState } from 'react';
import {
  Bell,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  Flame,
  Dumbbell,
  Utensils,
  Droplet,
  Smartphone,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { notificationService } from '../utils/notificationService';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export const NotificationSettingsModal: React.FC = () => {
  const {
    activeNotificationModal,
    setNotificationModal,
    reminders,
    toggleReminder,
    triggerManualPushReminder,
  } = useFitness();

  const [permissionState, setPermissionState] = useState<NotificationPermission>(() =>
    notificationService.getPermissionState()
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTime, setNewTime] = useState('18:00');

  const { dialogRef } = useDialogAccessibility({
    isOpen: Boolean(activeNotificationModal),
    onClose: () => setNotificationModal(false),
  });

  if (!activeNotificationModal) return null;

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermissionState(res);
    if (res === 'granted') {
      notificationService.send(
        '🔔 Push Reminders Activated!',
        'ApexQuest will keep you accountable with streak warnings and workout alerts.',
        '⚡'
      );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'streak':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'pushup':
        return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      case 'workout':
        return <Smartphone className="w-4 h-4 text-cyan-400" />;
      case 'meal':
        return <Utensils className="w-4 h-4 text-rose-400" />;
      case 'hydration':
        return <Droplet className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-dialog-title"
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 id="notification-dialog-title" className="font-game font-bold text-white text-base">Android Push Reminders</h3>
              <p className="text-[11px] text-slate-400">Keep streaks unbroken with proactive notifications</p>
            </div>
          </div>
          <button
            onClick={() => setNotificationModal(false)}
            aria-label="Close notification settings"
            className="p-1 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Banner */}
        <div className="my-3 p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {permissionState === 'granted' ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white">
                {permissionState === 'granted'
                  ? 'System Push Allowed'
                  : permissionState === 'denied'
                  ? 'Notifications Blocked'
                  : 'Push Permission Required'}
              </div>
              <div className="text-[10px] text-slate-400">
                {permissionState === 'granted'
                  ? 'Android status alerts active'
                  : 'Enable to receive sound & lockscreen nudges'}
              </div>
            </div>
          </div>

          {permissionState !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="py-1.5 px-3 min-h-[36px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md cursor-pointer transition-colors"
            >
              Grant
            </button>
          )}
        </div>

        {/* Reminders List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-game mb-1">
            Active Scheduled Alarms
          </div>

          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-3 rounded-2xl border transition-all ${
                reminder.enabled
                  ? 'bg-slate-950/80 border-emerald-500/30'
                  : 'bg-slate-950/40 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                    {getCategoryIcon(reminder.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{reminder.title}</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                        <Clock className="w-2.5 h-2.5" />
                        {reminder.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {reminder.message}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => triggerManualPushReminder(reminder)}
                    aria-label={`Test ${reminder.title} alert`}
                    className="p-1.5 min-h-[44px] min-w-[44px] rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center cursor-pointer"
                    title="Simulate / Test this alert now"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    <input
                      type="checkbox"
                      checked={reminder.enabled}
                      onChange={() => toggleReminder(reminder.id)}
                      aria-label={`Enable ${reminder.title}`}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[14px] after:left-[6px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Test Banner Trigger */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              notificationService.send(
                '🔥 Streak Savior Alert!',
                'You are 1,400 steps away from securing your 12-day streak before midnight!',
                '⚡'
              );
            }}
            className="flex-1 py-2.5 px-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Push Notification</span>
          </button>
          <button
            onClick={() => setNotificationModal(false)}
            aria-label="Save and dismiss notifications"
            className="py-2.5 px-4 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
