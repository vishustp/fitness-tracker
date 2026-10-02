import React, { useState } from 'react';
import {
  X,
  Trophy,
  Sparkles,
  Shield,
  Zap,
  Award,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { BossLootDrop } from '../types';

export const VictoryChestModal: React.FC = () => {
  const {
    isChestModalOpen,
    setIsChestModalOpen,
    activeBoss,
    claimBossLoot,
    dailyBossState,
  } = useFitness();

  const { dialogRef } = useDialogAccessibility({
    isOpen: isChestModalOpen,
    onClose: () => setIsChestModalOpen(false),
  });

  const [unlockedLoot, setUnlockedLoot] = useState<BossLootDrop | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  if (!isChestModalOpen) return null;

  const handleOpenChest = () => {
    if (isOpening || dailyBossState.chestClaimed) return;
    setIsOpening(true);

    setTimeout(() => {
      const loot = claimBossLoot();
      setUnlockedLoot(loot);
      setIsOpening(false);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chest-dialog-title"
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsChestModalOpen(false)}
          aria-label="Close Victory Chest Modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ambient Top Glow */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Raid Victory Reward
          </span>
          <h2 id="chest-dialog-title" className="font-game font-black text-xl text-white mt-2">
            Slayer's Victory Chest
          </h2>
          <p className="text-xs text-slate-400">
            Conquered: <strong className="text-white">{activeBoss.name}</strong>
          </p>
        </div>

        {/* CHEST UNBOXING GRAPHIC */}
        {!unlockedLoot && !dailyBossState.chestClaimed ? (
          <div className="py-6 space-y-4">
            <button
              onClick={handleOpenChest}
              disabled={isOpening}
              aria-label="Tap to unlock Victory Chest"
              className="relative mx-auto w-32 h-32 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 p-1 shadow-2xl shadow-amber-500/30 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all group"
            >
              <div className="w-full h-full rounded-[22px] bg-slate-950/80 flex flex-col items-center justify-center gap-1.5 border border-amber-400/40">
                <Gift
                  className={`w-14 h-14 text-amber-300 ${
                    isOpening ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'
                  }`}
                />
                <span className="text-[10px] font-game font-bold text-amber-300 tracking-wider">
                  {isOpening ? 'UNLOCKING...' : 'TAP TO OPEN'}
                </span>
              </div>
            </button>

            <p className="text-xs text-slate-400">
              Tap the chest to break the seal and claim your hard-earned spoils.
            </p>
          </div>
        ) : (
          <div className="py-2 space-y-3 animate-in zoom-in-95 duration-300">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-game font-bold text-amber-300 text-sm">
                Spoils of War Claimed!
              </span>
            </div>

            {/* Reward Cards Grid */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                  💎
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Gems Reward</div>
                  <div className="font-game font-bold text-white text-sm">
                    +{unlockedLoot?.gems || 20} Gems
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Warrior XP</div>
                  <div className="font-game font-bold text-white text-sm">
                    +{unlockedLoot?.xp || 500} XP
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">Consumable</div>
                  <div className="font-game font-bold text-white text-sm">
                    +1 Streak Shield
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">RPG Attribute</div>
                  <div className="font-game font-bold text-white text-xs truncate">
                    +Stats Boosted
                  </div>
                </div>
              </div>
            </div>

            {/* Title Unlock Card */}
            {unlockedLoot?.unlockedTitle && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 border border-amber-500/30 text-center">
                <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider block">
                  🏆 Slayer Title Unlocked
                </span>
                <span className="font-game font-black text-white text-base">
                  "{unlockedLoot.unlockedTitle}"
                </span>
              </div>
            )}

            <button
              onClick={() => setIsChestModalOpen(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-game font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all mt-2 min-h-[48px]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>RETURN TO TRAINING</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
