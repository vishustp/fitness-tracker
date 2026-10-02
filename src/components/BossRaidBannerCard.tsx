import React from 'react';
import { ShieldAlert, Zap, Skull, Trophy, Flame } from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

interface BossRaidBannerCardProps {
  className?: string;
}

export const BossRaidBannerCard: React.FC<BossRaidBannerCardProps> = ({ className = '' }) => {
  const { dailyBossState, activeBoss, setIsBossModalOpen, setIsChestModalOpen } = useFitness();

  const hpPercent = Math.max(0, Math.min(100, Math.round((dailyBossState.currentHp / dailyBossState.maxHp) * 100)));
  const isDefeated = dailyBossState.isDefeated;
  const chestClaimed = dailyBossState.chestClaimed;

  // Weakness labels
  const weaknessLabels: Record<string, string> = {
    pushups: 'Pushups & Calisthenics',
    gym: 'Heavy Gym Lifting',
    cardio: 'Cardio, Running & Steps',
    hiit: 'HIIT & Explosive Burn',
    flexibility: 'Flexibility & Mobility',
    custom: 'All Disciplines',
  };

  const weaknessText = weaknessLabels[activeBoss.weakness] || 'Physical Training';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 p-4 shadow-2xl transition-all group hover:border-amber-500/40 ${className}`}
    >
      {/* Background ambient radial glow matching boss element */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-br ${activeBoss.themeColor}`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Boss Portrait & Bio */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-lg bg-slate-950">
            <img
              src={activeBoss.avatarUrl}
              alt={activeBoss.name}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                isDefeated ? 'grayscale brightness-75' : ''
              }`}
              loading="lazy"
            />
            {isDefeated ? (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Skull className="w-6 h-6 text-rose-400" />
              </div>
            ) : (
              <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl-md bg-black/80 font-mono text-[9px] font-bold text-amber-400 uppercase">
                {activeBoss.element}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Daily Titan Raid
              </span>
              {isDefeated && !chestClaimed && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  🎁 Loot Ready
                </span>
              )}
            </div>

            <h3 className="font-game font-bold text-white text-sm sm:text-base tracking-wide truncate mt-0.5">
              {activeBoss.name}
            </h3>
            <p className="text-[11px] text-slate-400 line-clamp-1">{activeBoss.subtitle}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
          {isDefeated ? (
            chestClaimed ? (
              <button
                disabled
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 font-game text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed min-h-[44px]"
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Raid Conquered</span>
              </button>
            ) : (
              <button
                onClick={() => setIsChestModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-game text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer min-h-[44px]"
              >
                <Trophy className="w-4 h-4 fill-slate-950" />
                <span>Claim Victory Chest</span>
              </button>
            )
          ) : (
            <button
              onClick={() => setIsBossModalOpen(true)}
              aria-label={`Enter battle against ${activeBoss.name}`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-game text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Enter Battle</span>
            </button>
          )}
        </div>
      </div>

      {/* HP Bar & Weakness Footer */}
      <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Weakness: <strong className="text-amber-300">{weaknessText} (+50%)</strong></span>
          </span>
          <span className="font-bold text-white">
            {dailyBossState.currentHp.toLocaleString()} / {dailyBossState.maxHp.toLocaleString()} HP ({hpPercent}%)
          </span>
        </div>

        {/* Health Meter */}
        <div className="relative w-full h-2.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              hpPercent > 50
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : hpPercent > 20
                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                : 'bg-gradient-to-r from-rose-600 to-red-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Apex Strike charge preview */}
        {!isDefeated && (
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 text-cyan-400">
              <Zap className="w-3 h-3 fill-cyan-400" />
              <span>Apex Burst: {dailyBossState.apexChargePercent}%</span>
            </span>
            <span>{dailyBossState.apexChargePercent >= 50 ? '⚡ Strike Primed (In Arena)' : 'Log workouts to charge'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
