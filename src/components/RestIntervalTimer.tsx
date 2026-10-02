import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, Plus, Minus, X, Volume2, VolumeX, Bell } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

interface RestIntervalTimerProps {
  totalSeconds: number;
  onFinish?: () => void;
  onCancel?: () => void;
  title?: string;
  isFloating?: boolean;
}

export const RestIntervalTimer: React.FC<RestIntervalTimerProps> = ({
  totalSeconds,
  onFinish,
  onCancel,
  title = 'Rest Interval',
  isFloating = false,
}) => {
  const [initialDuration, setInitialDuration] = useState<number>(totalSeconds);
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const prevSecondsRef = useRef<number>(totalSeconds);

  useEffect(() => {
    setInitialDuration(totalSeconds);
    setSecondsLeft(totalSeconds);
    setIsPaused(false);
    prevSecondsRef.current = totalSeconds;
  }, [totalSeconds]);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!isMuted) {
            sounds.playCountdownBeep(true);
          }
          if (onFinish) onFinish();
          return 0;
        }

        // Warning countdown beeps at 3, 2, 1
        if (next <= 3 && next >= 1 && !isMuted) {
          sounds.playCountdownBeep(false);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isMuted, onFinish, secondsLeft]);

  const handleAdjustTime = (delta: number) => {
    setSecondsLeft((prev) => {
      const next = Math.max(5, prev + delta);
      if (next > initialDuration) {
        setInitialDuration(next);
      }
      return next;
    });
  };

  const progressPercent = initialDuration > 0
    ? Math.min(100, Math.max(0, ((initialDuration - secondsLeft) / initialDuration) * 100))
    : 100;

  const isLowTime = secondsLeft <= 5 && secondsLeft > 0;

  return (
    <div
      role="region"
      aria-label="Rest countdown timer"
      className={`rounded-2xl border transition-all duration-300 ${
        isFloating
          ? 'fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto shadow-2xl backdrop-blur-md bg-slate-900/95 border-emerald-500/40 p-3.5'
          : 'bg-slate-950/80 border-white/10 p-3.5'
      } ${isLowTime ? 'border-amber-400/80 shadow-lg shadow-amber-500/20' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isLowTime
                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isLowTime ? <Bell className="w-4 h-4 text-amber-400" /> : <Timer className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block truncate">
              {title}
            </span>
            <span
              className={`text-lg font-mono font-black tracking-tight leading-none ${
                isLowTime ? 'text-amber-400 animate-pulse' : 'text-white'
              }`}
            >
              {Math.floor(secondsLeft / 60)}:
              {(secondsLeft % 60).toString().padStart(2, '0')}s
            </span>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Adjust Time */}
          <button
            type="button"
            onClick={() => handleAdjustTime(-15)}
            aria-label="Subtract 15 seconds"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center font-mono text-[10px] cursor-pointer transition-colors"
          >
            -15s
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(15)}
            aria-label="Add 15 seconds"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center font-mono text-[10px] cursor-pointer transition-colors"
          >
            +15s
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Resume rest countdown' : 'Pause rest countdown'}
            className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center cursor-pointer transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? 'Unmute countdown beeps' : 'Mute countdown beeps'}
            title={isMuted ? 'Countdown audio muted' : 'Countdown audio active (3-2-1 beeps)'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-white/5 text-slate-300 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Cancel */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Dismiss rest timer"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isLowTime ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${100 - progressPercent}%` }}
        />
      </div>
    </div>
  );
};
