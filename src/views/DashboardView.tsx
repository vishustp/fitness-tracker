import React from 'react';
import {
  Flame,
  Shield,
  Crown,
  Footprints,
  Zap,
  Droplet,
  Plus,
  Share2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Dumbbell,
  UtensilsCrossed,
  Timer,
  Award,
  Camera,
  LogIn,
  Snowflake,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import {
  calculateBMR,
  calculateNetCalories,
  calculateStepCalories,
} from '../utils/fitnessCalculations';
import { TabType } from '../components/AndroidBottomNav';
import { DailyQuestProgression } from '../components/DailyQuestProgression';
import { DashboardMilestoneCelebration } from '../components/DashboardMilestoneCelebration';
import { TodayProgressSummaryCard } from '../components/TodayProgressSummaryCard';
import { BossRaidBannerCard } from '../components/BossRaidBannerCard';

interface DashboardViewProps {
  onNavigateTab: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const {
    user,
    currentUser,
    setActiveAuthModal,
    todayActivity,
    dailyQuests,
    claimQuestReward,
    addWater,
    updateTodaySteps,
    setActiveQuickLogModal,
    setShareModal,
    setNotificationModal,
    activateRestDayFreeze,
    restoreStreakWithPotion,
  } = useFitness();

  // Net Calorie Calculations for Today
  const bmr = calculateBMR(user.weightKg, user.heightCm, user.age, user.gender);
  const foodCalories = todayActivity.meals.reduce((sum, m) => sum + m.calories, 0);
  const workoutBurn = todayActivity.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const stepBurn = calculateStepCalories(todayActivity.steps, user.weightKg);
  const netStats = calculateNetCalories(foodCalories, bmr, workoutBurn, stepBurn);

  const xpPercent = Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100));
  const stepPercent = Math.min(100, Math.round((todayActivity.steps / user.dailyGoalSteps) * 100));
  const burnPercent = Math.min(100, Math.round((todayActivity.caloriesBurned / user.dailyGoalCaloriesBurn) * 100));
  const waterPercent = Math.min(100, Math.round((todayActivity.waterMl / user.dailyGoalWaterMl) * 100));

  const totalPushupsToday = todayActivity.workouts
    .filter((w) => w.pushupReps)
    .reduce((sum, w) => sum + (w.pushupReps || 0), 0);

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Optional Firebase Sync Banner if not logged in */}
      {!currentUser ? (
        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              🔥
            </div>
            <div>
              <span className="font-bold text-white block">Firebase Cloud Sync Ready</span>
              <span className="text-[10px] text-slate-400">Sign in with Firebase to backup levels & quest streaks</span>
            </div>
          </div>
          <button
            onClick={() => setActiveAuthModal(true)}
            className="py-1 px-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        </div>
      ) : (
        <div
          onClick={() => setActiveAuthModal(true)}
          className="p-2.5 px-3 rounded-2xl bg-slate-900/60 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-slate-900/90 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-[11px] font-mono">
              Firebase Cloud Connected • <span className="text-white font-bold">{currentUser.displayName || currentUser.email || 'Guest Warrior'}</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">Manage ⚙️</span>
        </div>
      )}

      {/* 1. RPG HERO PROFILE CARD */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 p-4 shadow-xl overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveAuthModal(true)}
              className="relative cursor-pointer group"
              title="View Firebase Warrior Account"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 font-black font-game text-[10px] px-1.5 py-0.2 rounded-full border border-black shadow">
                LV{user.level}
              </div>
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base text-white leading-tight">{user.name}</h1>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  {user.rankTier}
                </span>
              </div>
              <p className="text-xs text-emerald-400 font-semibold">{user.title}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <span>💎</span> {user.gems} Gems
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Shield className="w-3 h-3" /> {user.streakShields} Shields
                </span>
              </div>
            </div>
          </div>

          {/* Streak Flame Badge */}
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center shrink-0">
            <div className="relative">
              <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 text-[9px] font-black text-amber-300">⚡</span>
            </div>
            <span className="text-lg font-black font-game text-white leading-none mt-0.5">
              {user.currentStreak}
            </span>
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-tighter">
              Day Streak
            </span>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-3.5 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              XP to Level {user.level + 1} ({user.level < 5 ? 'Beginner Track' : 'Master Track'})
            </span>
            <span className="text-emerald-400 font-bold">
              {user.xp} / {user.xpToNextLevel} XP ({xpPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 glow-emerald"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* STREAK SHIELD & CRYO-FREEZE PROTECTION BAR */}
      <div
        className={`rounded-2xl p-3 border transition-all ${
          todayActivity.streakFrozen
            ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border-cyan-500/50 shadow-md shadow-cyan-500/10'
            : 'bg-slate-900/90 border-white/10'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                todayActivity.streakFrozen
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              {todayActivity.streakFrozen ? (
                <Snowflake className="w-4 h-4 text-cyan-300" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-white">
                  {todayActivity.streakFrozen ? 'Rest Day Freeze Active' : 'Streak Protection Shield'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                  {user.streakShields} available
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {todayActivity.streakFrozen
                  ? 'Flame is cryo-frozen for today. Rest & recover without penalty!'
                  : 'Safeguard your flame on planned rest days without breaking streak.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!todayActivity.streakFrozen && (
              <button
                type="button"
                onClick={activateRestDayFreeze}
                disabled={user.streakShields <= 0}
                aria-label="Activate rest day freeze for today"
                className={`py-1.5 px-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer min-h-[36px] flex items-center gap-1 ${
                  user.streakShields > 0
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 active:scale-95'
                    : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>Freeze Today</span>
              </button>
            )}

            {user.currentStreak < user.longestStreak && (
              <button
                type="button"
                onClick={restoreStreakWithPotion}
                title={`Revive streak back to ${user.longestStreak} days (150 gems)`}
                aria-label="Revive broken streak with Phoenix Elixir"
                className="py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold font-mono border border-amber-500/30 active:scale-95 transition-all min-h-[36px] flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Revive</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. VISUAL ANIMATION EFFECT FOR MILESTONES & LEVEL ASCENSION */}
      <DashboardMilestoneCelebration />

      {/* 3. CONSECUTIVE TARGETS QUEST PROGRESSION COMPONENT */}
      <DailyQuestProgression />

      {/* 4. QUICK ACTION LAUNCHPAD */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setActiveQuickLogModal('meal')}
          className="p-2.5 rounded-2xl bg-gradient-to-b from-amber-950/60 to-slate-900 border border-amber-500/40 hover:border-amber-400 flex flex-col items-center justify-center text-center transition-all cursor-pointer group active:scale-95 shadow-md shadow-amber-500/10"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-amber-300 leading-tight">Log Meal</span>
          <span className="text-[9px] text-amber-400 font-mono">Nutrition</span>
        </button>

        <button
          onClick={() => setActiveQuickLogModal('pushups')}
          className="p-2.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500 flex flex-col items-center justify-center text-center transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Dumbbell className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white leading-tight">Pushups</span>
          <span className="text-[9px] text-emerald-400 font-mono">+{totalPushupsToday} done</span>
        </button>

        <button
          onClick={() => setActiveQuickLogModal('gym')}
          className="p-2.5 rounded-2xl bg-slate-900/80 border border-violet-500/30 hover:border-violet-500 flex flex-col items-center justify-center text-center transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white leading-tight">Gym Sets</span>
          <span className="text-[9px] text-violet-400 font-mono">Weight log</span>
        </button>

        <button
          onClick={() => {
            const el = document.getElementById('daily-summary-card');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              setShareModal(true);
            }
          }}
          className="p-2.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-500 flex flex-col items-center justify-center text-center transition-all cursor-pointer group active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white leading-tight">Daily Summary</span>
          <span className="text-[9px] text-cyan-400 font-mono">Share & Copy</span>
        </button>
      </div>

      {/* 2. DAILY TITAN BOSS RAID */}
      <BossRaidBannerCard />

      {/* 4. NET CALORIC INTAKE COMMAND HUB */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="font-game font-bold text-white text-sm">Net Caloric Balance</h3>
          </div>
          <button
            onClick={() => onNavigateTab('fuel')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Big Net Indicator */}
        <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-game">
              Today's Net Energy
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-2xl font-black font-mono ${
                  netStats.net <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {netStats.net > 0 ? `+${netStats.net}` : netStats.net}
              </span>
              <span className="text-xs font-normal text-slate-400">kcal</span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ml-1 font-game ${
                  netStats.status === 'deficit'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {netStats.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">{netStats.description}</p>
          </div>

          <div className="text-right border-l border-white/10 pl-3 shrink-0">
            <div className="text-[10px] text-slate-400">Target Budget</div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {user.dailyCalorieBudget} kcal
            </div>
          </div>
        </div>

        {/* Breakdown Equation Formula */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-amber-400 block font-medium">Food Ingested</span>
            <span className="font-mono font-bold text-white text-sm">+{foodCalories}</span>
            <span className="text-[9px] text-slate-400 block">kcal consumed</span>
          </div>

          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-emerald-400 block font-medium">Active Burn</span>
            <span className="font-mono font-bold text-white text-sm">-{workoutBurn + stepBurn}</span>
            <span className="text-[9px] text-slate-400 block">workout + steps</span>
          </div>

          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-cyan-400 block font-medium">Base BMR</span>
            <span className="font-mono font-bold text-white text-sm">-{bmr}</span>
            <span className="text-[9px] text-slate-400 block">metabolism</span>
          </div>
        </div>
      </div>

      {/* 4. ACTIVITY RINGS & TODAY'S METRICS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Steps Card */}
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400">
              <Footprints className="w-4 h-4" />
            </div>
            <button
              onClick={() => updateTodaySteps(500)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-teal-400 text-xs font-mono font-bold"
              title="Add 500 steps"
            >
              +500
            </button>
          </div>

          <div className="my-2">
            <div className="text-xl font-black font-mono text-white">
              {todayActivity.steps.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">
              Goal: {user.dailyGoalSteps.toLocaleString()} steps ({stepPercent}%)
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${stepPercent}%` }}
            />
          </div>
        </div>

        {/* Active Calories Burned Card */}
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-rose-400 font-bold">Active</span>
          </div>

          <div className="my-2">
            <div className="text-xl font-black font-mono text-white">
              {todayActivity.caloriesBurned} <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Goal: {user.dailyGoalCaloriesBurn} kcal ({burnPercent}%)
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${burnPercent}%` }}
            />
          </div>
        </div>

        {/* Active Duration Mins */}
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
              <Timer className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-indigo-400 font-bold">Mins</span>
          </div>

          <div className="my-2">
            <div className="text-xl font-black font-mono text-white">
              {todayActivity.activeMinutes} <span className="text-xs font-normal text-slate-400">mins</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Goal: {user.dailyGoalActiveMinutes} mins
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (todayActivity.activeMinutes / user.dailyGoalActiveMinutes) * 100)}%` }}
            />
          </div>
        </div>

        {/* Water Hydration */}
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Droplet className="w-4 h-4" />
            </div>
            <button
              onClick={() => addWater(250)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-blue-400 text-xs font-mono font-bold"
              title="Add 250ml water"
            >
              +250ml
            </button>
          </div>

          <div className="my-2">
            <div className="text-xl font-black font-mono text-white">
              {todayActivity.waterMl} <span className="text-xs font-normal text-slate-400">ml</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Goal: {user.dailyGoalWaterMl} ml ({waterPercent}%)
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. TODAY'S PROGRESS SUMMARY CARD (SHARE INTENT & CLIPBOARD ENGINE) */}
      <div id="daily-summary-card">
        <TodayProgressSummaryCard />
      </div>

      {/* 6. DAILY QUESTS (RPG CHALLENGES) */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="font-game font-bold text-white text-sm">Today's Daily Quests</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            {dailyQuests.filter((q) => q.claimed).length} / {dailyQuests.length} Claimed
          </span>
        </div>

        <div className="space-y-2.5">
          {dailyQuests.map((quest) => {
            const isCompleted = quest.current >= quest.target;
            const progressPct = Math.min(100, Math.round((quest.current / quest.target) * 100));

            return (
              <div
                key={quest.id}
                className={`p-3 rounded-2xl border transition-all ${
                  quest.claimed
                    ? 'bg-slate-950/40 border-white/5 opacity-60'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950/80 border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{quest.title}</h4>
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{quest.description}</p>

                    {/* Progress Bar & Counter */}
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className={isCompleted ? 'text-emerald-400 font-bold' : ''}>
                        {quest.current.toLocaleString()} / {quest.target.toLocaleString()} {quest.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-400' : 'bg-teal-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward / Claim Action */}
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold mb-1">
                      <span>+{quest.xpReward} XP</span>
                      <span>•</span>
                      <span>+{quest.gemReward} 💎</span>
                    </div>

                    {quest.claimed ? (
                      <span className="text-[10px] text-slate-500 font-mono font-semibold">Claimed</span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => claimQuestReward(quest.id)}
                        className="py-1 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs font-game shadow cursor-pointer active:scale-95 transition-all animate-pulse"
                      >
                        CLAIM
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">{progressPct}%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. TODAY'S RECENT ACTIVITIES TIMELINE */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="font-game font-bold text-white text-sm">Today's Activity Logs</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {todayActivity.workouts.length} Workouts • {todayActivity.meals.length} Meals
          </span>
        </div>

        {todayActivity.workouts.length === 0 && todayActivity.meals.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No entries recorded yet today. Hit the quick action buttons above to log workouts or food!
          </div>
        ) : (
          <div className="space-y-2">
            {todayActivity.workouts.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-white truncate">{w.activityName}</h5>
                    <p className="text-[10px] text-slate-400">
                      {w.durationMinutes}m • {w.caloriesBurned} kcal burned
                      {w.pushupReps ? ` • ${w.pushupReps} pushups` : ''}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-amber-400">
                  +{w.xpGained} XP
                </span>
              </div>
            ))}

            {todayActivity.meals.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-white truncate">{m.name}</h5>
                    <p className="text-[10px] text-slate-400">
                      {m.mealType} • {m.calories} kcal • {m.proteinG}g P • {m.carbsG}g C
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-400">
                  {m.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
