import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Crown,
  Sparkles,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  X,
  Share2,
  Trophy,
  Star,
  PartyPopper,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { sounds } from '../utils/soundEffects';

export interface MilestoneEvent {
  id: string;
  type: 'level_up' | 'step_goal' | 'streak_record' | 'all_quests' | 'master_rank' | 'calorie_target';
  title: string;
  subtitle: string;
  badge: string;
  xpReward: number;
  gemsReward: number;
  highlightColor: string; // tailwind color class
  tierName?: string;
  description: string;
}

export const DashboardMilestoneCelebration: React.FC = () => {
  const { user, todayActivity, dailyQuests, levelUpInfo, setShareModal } = useFitness();

  const [activeCelebration, setActiveCelebration] = useState<MilestoneEvent | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [flyingParticles, setFlyingParticles] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);
  const celebrationShownRef = useRef<Set<string>>(new Set());
  const prevLevelRef = useRef<number>(user.level);

  // Trigger high-energy confetti burst
  const triggerConfettiCannon = (colorScheme: 'gold' | 'emerald' | 'rainbow' = 'gold') => {
    const colors =
      colorScheme === 'gold'
        ? ['#fbbf24', '#f59e0b', '#d97706', '#fef08a']
        : colorScheme === 'emerald'
        ? ['#10b981', '#34d399', '#059669', '#6ee7b7']
        : ['#fbbf24', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899'];

    // Left cannon
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 70,
      origin: { x: 0.1, y: 0.7 },
      colors,
    });

    // Right cannon
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 70,
      origin: { x: 0.9, y: 0.7 },
      colors,
    });

    // Center star burst
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 100,
        origin: { y: 0.5 },
        shapes: ['star', 'circle'],
        colors,
      });
    }, 250);
  };

  // Launch celebration flow
  const launchMilestoneEffect = (event: MilestoneEvent) => {
    setActiveCelebration(event);
    setShowCelebrationModal(true);

    if (event.type === 'level_up' || event.type === 'master_rank') {
      sounds.playLevelUp();
      triggerConfettiCannon('rainbow');
    } else {
      sounds.playQuestComplete();
      triggerConfettiCannon(event.type === 'streak_record' ? 'gold' : 'emerald');
    }

    // Spawn floating floating reward tags
    const particles = [
      { id: 1, text: `+${event.xpReward} XP`, x: 25, y: 35 },
      { id: 2, text: `+${event.gemsReward} 💎`, x: 65, y: 40 },
      { id: 3, text: '⭐ MILESTONE REACHED!', x: 45, y: 20 },
    ];
    setFlyingParticles(particles);

    // Auto-clear floating tags
    setTimeout(() => {
      setFlyingParticles([]);
    }, 3500);
  };

  // 1. Auto-detect Level-Up or LevelUpInfo trigger
  useEffect(() => {
    if (levelUpInfo && !celebrationShownRef.current.has(`level_${levelUpInfo.newLevel}`)) {
      celebrationShownRef.current.add(`level_${levelUpInfo.newLevel}`);
      launchMilestoneEffect({
        id: `lvl_${levelUpInfo.newLevel}`,
        type: levelUpInfo.newLevel >= 5 ? 'master_rank' : 'level_up',
        title: `ASCENDED TO LEVEL ${levelUpInfo.newLevel}!`,
        subtitle: `Unlocked Rank: ${levelUpInfo.title}`,
        badge: levelUpInfo.newLevel >= 5 ? '👑' : '⚡',
        xpReward: levelUpInfo.newLevel * 250,
        gemsReward: levelUpInfo.gemsAwarded,
        highlightColor: 'from-amber-400 via-yellow-500 to-amber-600',
        tierName: levelUpInfo.newLevel >= 5 ? 'Master Tier Ascendant' : 'Beginner Progression',
        description: `You broke through the barrier! Your power, discipline, and endurance have leveled up.`,
      });
    } else if (user.level > prevLevelRef.current) {
      const newLvl = user.level;
      if (!celebrationShownRef.current.has(`level_${newLvl}`)) {
        celebrationShownRef.current.add(`level_${newLvl}`);
        launchMilestoneEffect({
          id: `lvl_${newLvl}`,
          type: newLvl >= 5 ? 'master_rank' : 'level_up',
          title: `LEVEL ${newLvl} ACHIEVED!`,
          subtitle: `${user.title} (${user.rankTier})`,
          badge: newLvl >= 5 ? '👑' : '🔥',
          xpReward: newLvl * 200,
          gemsReward: newLvl * 20,
          highlightColor: 'from-emerald-400 to-teal-500',
          tierName: user.rankTier,
          description: `Outstanding dedication! You've climbed another tier in the global fitness rankings.`,
        });
      }
      prevLevelRef.current = newLvl;
    }
  }, [user.level, levelUpInfo]);

  // 2. Auto-detect Daily Step Milestone (10,000 steps)
  useEffect(() => {
    if (todayActivity.steps >= 10000 && !celebrationShownRef.current.has('steps_10k')) {
      celebrationShownRef.current.add('steps_10k');
      launchMilestoneEffect({
        id: 'steps_10k',
        type: 'step_goal',
        title: '10,000 STEPS CONQUERED!',
        subtitle: 'Titan Pacer Milestone Cleared',
        badge: '👟',
        xpReward: 300,
        gemsReward: 30,
        highlightColor: 'from-teal-400 to-cyan-500',
        tierName: 'Daily Cardio Titan',
        description: `You crushed 10,000 steps today! Your cardio endurance and active caloric burn are at peak levels.`,
      });
    }
  }, [todayActivity.steps]);

  // 3. Auto-detect All Daily Quests Cleared
  useEffect(() => {
    const allClaimedOrDone =
      dailyQuests.length > 0 && dailyQuests.every((q) => q.current >= q.target);
    if (allClaimedOrDone && !celebrationShownRef.current.has('all_quests_cleared')) {
      celebrationShownRef.current.add('all_quests_cleared');
      launchMilestoneEffect({
        id: 'all_quests_cleared',
        type: 'all_quests',
        title: '100% DAILY QUESTS CLEARED!',
        subtitle: 'Flawless Daily Victory',
        badge: '⚔️',
        xpReward: 500,
        gemsReward: 50,
        highlightColor: 'from-emerald-500 to-teal-600',
        tierName: 'Daily Perfectionist',
        description: `Every single daily challenge has been defeated. Maximum XP efficiency unlocked!`,
      });
    }
  }, [dailyQuests]);

  // 4. Auto-detect Consecutive Target Streak Milestone (3d, 7d, 14d)
  useEffect(() => {
    const streak = user.consecutiveTargetsStreak || user.currentStreak;
    if (streak >= 7 && !celebrationShownRef.current.has('streak_7d')) {
      celebrationShownRef.current.add('streak_7d');
      launchMilestoneEffect({
        id: 'streak_7d',
        type: 'streak_record',
        title: '7-DAY STREAK MILESTONE!',
        subtitle: 'Iron Will Habit Formed',
        badge: '🔥',
        xpReward: 700,
        gemsReward: 70,
        highlightColor: 'from-amber-500 to-orange-600',
        tierName: 'Week-Long Streak Immortal',
        description: `7 consecutive days of hitting calorie and activity targets! Habit formed, multiplier maximized.`,
      });
    }
  }, [user.consecutiveTargetsStreak, user.currentStreak]);

  // Demo / Replay Trigger Presets
  const demoMilestones: MilestoneEvent[] = [
    {
      id: 'demo_master',
      type: 'master_rank',
      title: 'MASTER RANK ASCENSION (LVL 5+)!',
      subtitle: 'Graduated from Beginner Track to Master',
      badge: '👑',
      xpReward: 1000,
      gemsReward: 100,
      highlightColor: 'from-amber-400 via-yellow-500 to-amber-600',
      tierName: 'Apex Master League',
      description: 'You completed all 5 Beginner ranks and entered the prestigious Master tier with advanced buffs!',
    },
    {
      id: 'demo_steps',
      type: 'step_goal',
      title: '10,000 STEPS MILESTONE!',
      subtitle: 'Conquered 10,000 Steps in a Single Day',
      badge: '⚡',
      xpReward: 350,
      gemsReward: 35,
      highlightColor: 'from-teal-400 to-emerald-500',
      tierName: 'Cardio Dominance',
      description: 'Supercharged aerobic endurance! 10k steps burns ~450 active calories and boosts longevity.',
    },
    {
      id: 'demo_streak',
      type: 'streak_record',
      title: '14-DAY HABIT MILESTONE!',
      subtitle: '2 Consecutive Weeks of Hitting Target Goals',
      badge: '🔥',
      xpReward: 800,
      gemsReward: 80,
      highlightColor: 'from-orange-500 to-rose-500',
      tierName: 'Unstoppable Momentum',
      description: 'Two full weeks without breaking the chain! Your XP bonus multiplier is at 1.5x.',
    },
    {
      id: 'demo_pushups',
      type: 'calorie_target',
      title: 'CENTURION PUSHUP WARRIOR!',
      subtitle: '100 Pushups Logged & Perfect Form',
      badge: '💪',
      xpReward: 500,
      gemsReward: 50,
      highlightColor: 'from-emerald-400 to-cyan-500',
      tierName: 'Upper Body Titan',
      description: '100 pushup reps logged today with active energy burn and upper-body muscle hyper-trophy.',
    },
  ];

  return (
    <>
      {/* IN-DASHBOARD MILESTONE CELEBRATION BANNER & SHOWCASE */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/70 border border-amber-500/40 p-3.5 shadow-xl overflow-hidden">
        {/* Radiant shimmer light sweep */}
        <div className="absolute inset-0 pointer-events-none opacity-30 animate-shimmer" />

        {/* Ambient background glows */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Pulsing Animated Crest Badge */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/40 animate-ping opacity-60" />
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-xl">
                  {user.level >= 5 ? '👑' : '🏆'}
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-game font-black text-white text-xs tracking-wide">
                  GAMIFIED MILESTONES & LEVEL EFFECTS
                </h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  {user.level < 5 ? `Beginner LV${user.level}` : `Master LV${user.level}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                {user.level < 5
                  ? `Ascend ${5 - user.level} more levels to reach Master League Tier!`
                  : `Master Tier Active • ${user.currentStreak}-Day Streak Milestone!`}
              </p>
            </div>
          </div>

          {/* Interactive Trigger Button */}
          <button
            onClick={() => launchMilestoneEffect(demoMilestones[0])}
            className="shrink-0 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black font-game text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 transition-all group"
            title="Trigger celebratory visual milestone animation"
          >
            <Sparkles className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
            <span>CELEBRATE</span>
          </button>
        </div>

        {/* Milestone Quick Replay Pills */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
          <span className="text-slate-400 font-mono shrink-0 flex items-center gap-1 mr-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            Milestone Tests:
          </span>
          {demoMilestones.map((m) => (
            <button
              key={m.id}
              onClick={() => launchMilestoneEffect(m)}
              className="px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/5 hover:border-amber-500/40 shrink-0 font-medium transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <span>{m.badge}</span>
              <span>{m.title.split('!')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FULL CELEBRATION MODAL WITH RADIANT SHOCKWAVES & PARTICLES */}
      {showCelebrationModal && activeCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          {/* Floating animated reward tags */}
          {flyingParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute pointer-events-none text-sm md:text-base font-black font-game text-amber-300 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-400/60 shadow-xl animate-float-particle z-50"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
            >
              {particle.text}
            </div>
          ))}

          <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/70 rounded-3xl p-6 shadow-2xl shadow-amber-500/30 text-center overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Rotating sunburst rays background aura */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 pointer-events-none">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/25 to-emerald-500/20 blur-xl animate-spin-slow" />
            </div>

            {/* Triple Pulsing Golden Shockwave Rings */}
            <div className="relative mx-auto w-28 h-28 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping opacity-60" />
              <div className="absolute -inset-2 rounded-full border border-yellow-300/30 animate-pulse-burst" />

              {/* Central Glowing Crest Shield */}
              <div
                className={`relative w-24 h-24 rounded-3xl bg-gradient-to-tr ${activeCelebration.highlightColor} p-1 shadow-2xl shadow-amber-500/40 flex items-center justify-center animate-pulse`}
              >
                <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center">
                  <span className="text-4xl mb-0.5 drop-shadow-md select-none">
                    {activeCelebration.badge}
                  </span>
                  <span className="text-[10px] font-black font-game text-amber-400 tracking-wider">
                    {activeCelebration.tierName || 'LEVEL UP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Radiant Title & Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-game shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
              <span>MILESTONE CONQUERED!</span>
            </div>

            <h2 className="text-xl md:text-2xl font-black font-game text-white tracking-wide leading-tight">
              {activeCelebration.title}
            </h2>

            <p className="text-amber-300 font-bold text-xs mt-1">
              {activeCelebration.subtitle}
            </p>

            <p className="text-slate-300 text-xs mt-2 px-2 leading-relaxed">
              {activeCelebration.description}
            </p>

            {/* Rewards Display Cards */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-[11px] text-slate-400 font-mono">Bounty XP</span>
                <div className="flex items-center gap-1 mt-0.5 text-amber-400 font-black font-mono text-lg">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>+{activeCelebration.xpReward}</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 flex flex-col items-center">
                <span className="text-[11px] text-slate-400 font-mono">Rare Gems</span>
                <div className="flex items-center gap-1 mt-0.5 text-emerald-400 font-black font-mono text-lg">
                  <span>💎</span>
                  <span>+{activeCelebration.gemsReward}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  triggerConfettiCannon('rainbow');
                  sounds.playQuestComplete();
                  setShowCelebrationModal(false);
                  setShareModal(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black font-game text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>SHARE GLORY TO SOCIALS</span>
              </button>

              <button
                onClick={() => {
                  triggerConfettiCannon('gold');
                  sounds.playGemPing();
                  setShowCelebrationModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer transition-colors border border-white/5"
              >
                Claim Bounty & Continue Quest
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
