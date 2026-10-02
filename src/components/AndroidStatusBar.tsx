import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Bell, Volume2, VolumeX, Smartphone, Monitor, LogIn, UserCheck } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

interface AndroidStatusBarProps {
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  isFrameMode,
  onToggleFrameMode,
}) => {
  const { soundEnabled, toggleSound, setNotificationModal, currentUser, setActiveAuthModal } = useFitness();
  const [time, setTime] = useState<string>('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-300 select-none z-30 bg-slate-950/85 backdrop-blur-md border-b border-white/5">
      {/* Left side: Clock, notification, and Google Auth pill */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-100 tracking-tight text-[13px]">{time}</span>
        <button
          onClick={() => setNotificationModal(true)}
          aria-label="Push Notifications & Reminders"
          className="p-1.5 rounded-full hover:bg-white/10 text-emerald-400 transition-colors relative min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          title="Push Reminders"
        >
          <Bell className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" aria-hidden="true" />
        </button>

        {currentUser ? (
          <button
            onClick={() => setActiveAuthModal(true)}
            aria-label={`Firebase Account: ${currentUser.displayName || currentUser.email || 'Guest'}. Tap to manage.`}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer min-h-[36px]"
            title={`Firebase Account: ${currentUser.displayName || currentUser.email || 'Guest'}. Tap to manage.`}
          >
            <UserCheck className="w-3 h-3" aria-hidden="true" />
            <span className="max-w-[60px] truncate">{currentUser.displayName?.split(' ')[0] || (currentUser.isAnonymous ? 'Guest' : 'Cloud')}</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveAuthModal(true)}
            aria-label="Sign in with Firebase"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[10px] text-blue-400 hover:bg-blue-500/25 transition-colors cursor-pointer min-h-[36px]"
            title="Sign in with Firebase to sync Firestore data"
          >
            <LogIn className="w-3 h-3" aria-hidden="true" />
            <span>Login</span>
          </button>
        )}
      </div>

      {/* Center notch / camera placeholder in frame mode */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700/80 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
        </div>
      </div>

      {/* Right side: Sound toggle, Screen Frame toggle, 5G, Wifi, Battery */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSound}
          aria-label={soundEnabled ? 'Mute Game Audio' : 'Unmute Game Audio'}
          className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          title={soundEnabled ? 'Mute Game Audio' : 'Unmute Game Audio'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />}
        </button>

        <button
          onClick={onToggleFrameMode}
          aria-label={isFrameMode ? 'Switch to Fullscreen View' : 'Switch to Android Device Frame'}
          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors hidden sm:flex items-center gap-1 min-h-[36px] min-w-[36px] justify-center cursor-pointer"
          title={isFrameMode ? 'Switch to Fullscreen View' : 'Switch to Android Device Frame'}
        >
          {isFrameMode ? <Monitor className="w-3.5 h-3.5" aria-hidden="true" /> : <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />}
        </button>

        <span className="text-[10px] font-bold text-slate-400 tracking-tighter">5G</span>
        <Wifi className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center gap-0.5">
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] text-slate-400">89%</span>
        </div>
      </div>
    </div>
  );
};
