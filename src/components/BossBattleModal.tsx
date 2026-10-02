import React, { useState } from 'react';
import {
  X,
  Zap,
  Flame,
  ShieldAlert,
  Sparkles,
  Trophy,
  History,
  Swords,
  AlertCircle,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export const BossBattleModal: React.FC = () => {
  const {
    dailyBossState,
    activeBoss,
    isBossModalOpen,
    setIsBossModalOpen,
    setIsChestModalOpen,
    executeApexStrike,
    user,
  } = useFitness();

  const { dialogRef } = useDialogAccessibility({
    isOpen: isBossModalOpen,
    onClose: () => setIsBossModalOpen(false),
  });

  const [hitFlash, setHitFlash] = useState(false);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; isCrit: boolean } | null>(null);

  if (!isBossModalOpen) return null;

  const hpPercent = Math.max(0, Math.min(100, Math.round((dailyBossState.currentHp / dailyBossState.maxHp) * 100)));
  const isDefeated = dailyBossState.isDefeated;
  const canStrike = dailyBossState.apexChargePercent >= 50 && !isDefeated;

  const handleStrike = () => {
    if (!canStrike) return;
    const res = executeApexStrike();

    // Trigger visual hit reactions
    setHitFlash(true);
    setFloatingDamage({
      id: Date.now(),
      text: res.isCrit ? `-${res.damage} CRITICAL!` : `-${res.damage}`,
      isCrit: res.isCrit,
    });

    setTimeout(() => setHitFlash(false), 300);
    setTimeout(() => setFloatingDamage(null), 1200);
  };

  const handleOpenChest = () => {
    setIsBossModalOpen(false);
    setIsChestModalOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="boss-battle-title"
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 id="boss-battle-title" className="font-game font-bold text-white text-base tracking-wide">
                Daily Titan Raid Arena
              </h2>
              <p className="text-[11px] text-slate-400">
                Turn physical training into devastating combat strikes
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBossModalOpen(false)}
            aria-label="Close Boss Battle Modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BOSS SHOWCASE ARENA */}
        <div className="relative rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-white/10 p-5 text-center overflow-hidden">
          {/* Ambient Elemental Glow */}
          <div
            className={`absolute inset-0 opacity-15 blur-2xl pointer-events-none bg-gradient-to-tr ${activeBoss.themeColor}`}
            aria-hidden="true"
          />

          {/* Floating Damage Text Popup */}
          {floatingDamage && (
            <div
              key={floatingDamage.id}
              className={`absolute top-10 left-1/2 -translate-x-1/2 z-30 font-game font-black text-xl pointer-events-none transition-all duration-500 ease-out tracking-widest ${
                floatingDamage.isCrit
                  ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-125'
                  : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            >
              {floatingDamage.text}
            </div>
          )}

          {/* Boss Portrait */}
          <div className="relative mx-auto w-32 h-32 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl mb-3 bg-black">
            <img
              src={activeBoss.avatarUrl}
              alt={activeBoss.name}
              className={`w-full h-full object-cover transition-all duration-200 ${
                hitFlash ? 'brightness-200 scale-95' : 'hover:scale-105'
              } ${isDefeated ? 'grayscale brightness-50' : ''}`}
            />
            {isDefeated && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                <Trophy className="w-8 h-8 text-amber-400" />
                <span className="text-[10px] font-game font-black text-amber-300 tracking-wider">
                  DEFEATED
                </span>
              </div>
            )}
          </div>

          <h3 className="font-game font-black text-lg text-white tracking-wide">
            {activeBoss.name}
          </h3>
          <p className="text-xs text-slate-400 italic max-w-sm mx-auto mt-0.5">
            "{activeBoss.subtitle}"
          </p>

          <p className="text-[11px] text-slate-300 mt-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 line-clamp-2">
            {activeBoss.description}
          </p>

          {/* Boss HP Bar */}
          <div className="mt-4 space-y-1 text-left">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase tracking-wider">
                Titan Vitality
              </span>
              <span className="font-black text-white">
                {dailyBossState.currentHp.toLocaleString()} / {dailyBossState.maxHp.toLocaleString()} HP ({hpPercent}%)
              </span>
            </div>

            <div className="relative w-full h-3.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  hpPercent > 50
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : hpPercent > 20
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                    : 'bg-gradient-to-r from-rose-600 to-red-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* COMBAT ACTIONS & STRIKE BUTTON */}
        <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-cyan-400 text-cyan-400" />
              <span>Apex Energy Charge:</span>
            </span>
            <span className="font-bold text-cyan-400 text-sm">
              {dailyBossState.apexChargePercent}% / 100%
            </span>
          </div>

          {/* Charge Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${dailyBossState.apexChargePercent}%` }}
            />
          </div>

          {/* Action Trigger Buttons */}
          {isDefeated ? (
            <button
              onClick={handleOpenChest}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-game font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95 transition-all min-h-[48px]"
            >
              <Trophy className="w-5 h-5 fill-slate-950" />
              <span>CLAIM SLAYER'S VICTORY CHEST</span>
            </button>
          ) : (
            <button
              onClick={handleStrike}
              disabled={!canStrike}
              aria-label="Engage Apex Strike"
              className={`w-full py-3.5 px-4 rounded-xl font-game font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                canStrike
                  ? 'bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white shadow-xl shadow-rose-600/30 cursor-pointer active:scale-95 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>
                {canStrike ? '⚡ ENGAGE APEX STRIKE (COSTS 50%)' : 'APEX CHARGE INSUFFICIENT (50% NEEDED)'}
              </span>
            </button>
          )}

          {!isDefeated && !canStrike && (
            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Log workouts or steps to charge your Apex Strike and deal passive chip damage.</span>
            </p>
          )}
        </div>

        {/* COMBAT EVENT LOG */}
        <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 pb-1 border-b border-white/5">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Today's Battle Ledger ({dailyBossState.damageLog.length})</span>
          </div>

          {dailyBossState.damageLog.length === 0 ? (
            <p className="text-[11px] text-slate-500 text-center py-3">
              No battle strikes logged today. Complete any workout to begin the raid!
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {dailyBossState.damageLog.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-900/60 border border-white/5"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-300 truncate font-medium">{log.source}</span>
                    {log.isWeakness && (
                      <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                        WEAKNESS!
                      </span>
                    )}
                    {log.isCrit && (
                      <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300 font-bold">
                        CRIT!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className="font-bold text-rose-400">-{log.damage} HP</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
