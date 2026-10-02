import React from 'react';
import {
  Flame,
  Target,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import {
  calculateBMR,
  calculateNetCalories,
  calculateStepCalories,
  getStreakMultiplier,
} from '../utils/fitnessCalculations';

export const DailyQuestProgression: React.FC = () => {
  const { user, todayActivity, claimAchievement } = useFitness();

  // Net Calorie Calculations for Today's Calorie Target
  const bmr = calculateBMR(user.weightKg, user.heightCm, user.age, user.gender);
  const foodCalories = todayActivity.meals.reduce((sum, m) => sum + m.calories, 0);
  const workoutBurn = todayActivity.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const stepBurn = calculateStepCalories(todayActivity.steps, user.weightKg);
  const totalBurn = workoutBurn + stepBurn;
  const netStats = calculateNetCalories(foodCalories, bmr, workoutBurn, stepBurn);

  // Twin Targets Evaluation
  // Target 1: Calorie Target: food logged and within budget or in deficit
  const isCalorieTargetMet =
    todayActivity.meals.length >= 2 &&
    foodCalories <= user.dailyCalorieBudget &&
    netStats.net <= 150;

  // Target 2: Activity Target: 8,000+ steps OR 500+ active kcal
  const isActivityTargetMet =
    todayActivity.steps >= 8000 || todayActivity.caloriesBurned >= 500;

  const areBothTargetsMet = isCalorieTargetMet && isActivityTargetMet;

  // Consecutive streak and multiplier
  const consecutiveDays = user.consecutiveTargetsStreak || (areBothTargetsMet ? 4 : 3);
  const streakInfo = getStreakMultiplier(consecutiveDays);

  // Beginner 1-5 then Master milestones
  const levelMilestones = [
    { level: 1, name: 'Beginner I', tier: 'Beginner' },
    { level: 2, name: 'Beginner II', tier: 'Beginner' },
    { level: 3, name: 'Beginner III', tier: 'Beginner' },
    { level: 4, name: 'Beginner IV', tier: 'Beginner' },
    { level: 5, name: 'Beginner V', tier: 'Beginner' },
    { level: 6, name: 'Master I', tier: 'Master' },
    { level: 10, name: 'Grandmaster', tier: 'Grandmaster' },
  ];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 p-4 shadow-xl space-y-3.5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Title and Streak flame */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-game font-bold text-white text-sm">Consecutive Target Quest</h3>
            <p className="text-[11px] text-slate-400">Hit both Calorie & Activity goals every single day</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>{consecutiveDays}d Streak</span>
        </div>
      </div>

      {/* Streak Multiplier Banner */}
      <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black font-game flex items-center justify-center text-sm shadow-md">
            {streakInfo.multiplier}x
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">{streakInfo.badge}</div>
            <div className="text-[10px] text-amber-400">
              +{streakInfo.bonusPercent}% Bonus XP awarded on all workouts & quests
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Next Milestone</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {consecutiveDays >= 5 ? '7 Days (2.0x)' : '5 Days (Master)'}
          </span>
        </div>
      </div>

      {/* TODAY'S TWIN TARGET CARDS */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Target 1: Calorie Control */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            isCalorieTargetMet
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : 'bg-slate-950/60 border-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 font-game uppercase">Target 1: Calorie</span>
            {isCalorieTargetMet ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
          <div className="font-bold text-white text-xs">Net Calorie Deficit</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {foodCalories} / {user.dailyCalorieBudget} kcal
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCalorieTargetMet ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{
                width: `${Math.min(100, Math.round((foodCalories / user.dailyCalorieBudget) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Target 2: Activity Output */}
        <div
          className={`p-3 rounded-2xl border transition-all ${
            isActivityTargetMet
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : 'bg-slate-950/60 border-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 font-game uppercase">Target 2: Activity</span>
            {isActivityTargetMet ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
          <div className="font-bold text-white text-xs">8k Steps or 500 kcal</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {todayActivity.steps.toLocaleString()} steps • {todayActivity.caloriesBurned} kcal
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isActivityTargetMet ? 'bg-emerald-400' : 'bg-teal-400'
              }`}
              style={{
                width: `${Math.min(100, Math.round((todayActivity.steps / 8000) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* BEGINNER LEVEL 1-5 TO MASTER PROGRESSION ROADMAP */}
      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-game font-semibold text-slate-400 uppercase">
            Ascension Track: Beginner to Master
          </span>
          <span className="font-mono text-emerald-400 font-bold text-[11px]">
            Current: {user.title}
          </span>
        </div>

        {/* Level step nodes */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 no-scrollbar">
          {levelMilestones.map((milestone) => {
            const isCompleted = user.level > milestone.level;
            const isCurrent = user.level === milestone.level;
            const isMasterUnlock = milestone.level === 6;

            return (
              <div
                key={milestone.level}
                className={`flex-1 min-w-[50px] p-1.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-emerald-500/20 border-emerald-500 ring-1 ring-emerald-500/50'
                    : isCompleted
                    ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950/60 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-center mb-0.5">
                  {isMasterUnlock ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      L{milestone.level}
                    </span>
                  )}
                </div>
                <div className="text-[9px] font-game font-bold truncate leading-tight text-white">
                  {milestone.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
