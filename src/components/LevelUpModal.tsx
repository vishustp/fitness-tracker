import React from 'react';
import { Crown, Sparkles, Award, ArrowUpRight, Zap, Shield, Heart } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export const LevelUpModal: React.FC = () => {
  const { levelUpInfo, dismissLevelUp, user, setShareModal } = useFitness();
  const { dialogRef } = useDialogAccessibility({
    isOpen: Boolean(levelUpInfo),
    onClose: dismissLevelUp,
  });

  if (!levelUpInfo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-dialog-title"
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl shadow-emerald-500/20 text-center overflow-hidden">
        {/* Radiant glow ring */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Rank Crest */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-1 shadow-xl flex items-center justify-center">
            <div className="w-full h-full rounded-xl bg-slate-950 flex flex-col items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400 mb-0.5 animate-pulse" />
              <span className="text-xl font-black font-game text-white tracking-wider">
                LVL {levelUpInfo.newLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Level Up Announcement */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 font-game">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Rank Ascension
        </div>

        <h3 id="levelup-dialog-title" className="text-2xl font-black font-game text-white tracking-wide">
          LEVEL REACHED!
        </h3>
        <p className="text-emerald-400 font-semibold text-sm mt-0.5">
          New Title: <span className="text-amber-300 underline underline-offset-2">{levelUpInfo.title}</span>
        </p>

        {/* Rewards Box */}
        <div className="grid grid-cols-2 gap-2 my-5">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs text-slate-400">Gem Bounty</span>
            <div className="flex items-center gap-1 mt-1 text-emerald-400 font-bold font-mono text-lg">
              <span>💎</span>
              <span>+{levelUpInfo.gemsAwarded}</span>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-xs text-slate-400">League Standing</span>
            <div className="flex items-center gap-1 mt-1 text-amber-400 font-bold font-mono text-lg">
              <Award className="w-5 h-5 text-amber-400" />
              <span>{user.rankTier}</span>
            </div>
          </div>
        </div>

        {/* Stat boosts */}
        <div className="bg-white/5 rounded-2xl p-3 mb-5 text-left border border-white/5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-game">
            Attribute Progression
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Strength</span>
              <span className="font-mono text-emerald-400 font-bold">+{user.rpgAttributes.strength}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" /> Stamina</span>
              <span className="font-mono text-emerald-400 font-bold">+{user.rpgAttributes.stamina}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-cyan-400" /> Agility</span>
              <span className="font-mono text-emerald-400 font-bold">+{user.rpgAttributes.agility}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-indigo-400" /> Discipline</span>
              <span className="font-mono text-emerald-400 font-bold">+{user.rpgAttributes.discipline}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              dismissLevelUp();
              setShareModal(true);
            }}
            aria-label="Share glory to socials"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
          >
            <span>Share Glory to Socials</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={dismissLevelUp}
            aria-label="Claim rewards and continue quest"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Claim & Continue Quest
          </button>
        </div>
      </div>
    </div>
  );
};
