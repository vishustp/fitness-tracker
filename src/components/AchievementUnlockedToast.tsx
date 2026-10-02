import React from 'react';
import { Award, Sparkles, X, ChevronRight } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

export const AchievementUnlockedToast: React.FC = () => {
  const { newAchievementUnlocked, dismissAchievementToast } = useFitness();

  if (!newAchievementUnlocked) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 animate-in slide-in-from-bottom-8 duration-300">
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl shadow-amber-500/20 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
          <Award className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-game">
              Achievement Unlocked!
            </span>
          </div>
          <h4 className="text-sm font-bold text-white truncate">{newAchievementUnlocked.title}</h4>
          <p className="text-xs text-slate-300 truncate">{newAchievementUnlocked.description}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-emerald-400">
            <span>+{newAchievementUnlocked.xpReward} XP</span>
            <span>•</span>
            <span>+{newAchievementUnlocked.gemReward} 💎</span>
          </div>
        </div>
        <button
          onClick={dismissAchievementToast}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
