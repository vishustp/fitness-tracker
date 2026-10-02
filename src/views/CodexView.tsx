import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Flame,
  Footprints,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Info,
  Zap,
  Cloud,
  Shield,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import {
  calculateBMR,
  calculateNetCalories,
  calculateStepCalories,
} from '../utils/fitnessCalculations';
import { DailyActivity } from '../types';

export const CodexView: React.FC = () => {
  const { history, user, selectedDate, setSelectedDate, currentUser, setActiveAuthModal, lastSyncedAt } = useFitness();
  const [chartView, setChartView] = useState<'calories' | 'steps' | 'workouts'>('calories');
  const [hoveredDay, setHoveredDay] = useState<DailyActivity | null>(null);

  // Focus day for detail view
  const currentSelectedDay =
    history.find((d) => d.date === selectedDate) || history[history.length - 1];

  // Last 7 days for the chart
  const recent7Days = history.slice(-7);
  // Last 14 days for wider view
  const recent14Days = history.slice(-14);

  // Monthly summary metrics (based on the 30-day history)
  const totalMonthlySteps = history.reduce((sum, d) => sum + d.steps, 0);
  const totalMonthlyActiveBurn = history.reduce((sum, d) => sum + d.caloriesBurned, 0);
  const totalMonthlyWorkouts = history.reduce((sum, d) => sum + d.workouts.length, 0);
  const totalMonthlyPushups = history.reduce((sum, d) => {
    return sum + d.workouts.reduce((wSum, w) => wSum + (w.pushupReps || 0), 0);
  }, 0);

  const bmr = calculateBMR(user.weightKg, user.heightCm, user.age, user.gender);

  // Selected Day Net calculations
  const selectedFood = currentSelectedDay.meals.reduce((sum, m) => sum + m.calories, 0);
  const selectedWorkoutBurn = currentSelectedDay.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const selectedStepBurn = calculateStepCalories(currentSelectedDay.steps, user.weightKg);
  const selectedNet = calculateNetCalories(selectedFood, bmr, selectedWorkoutBurn, selectedStepBurn);

  // Find max values for chart scaling
  const maxCaloriesInChart = Math.max(
    ...recent7Days.map((d) => {
      const food = d.meals.reduce((sum, m) => sum + m.calories, 0);
      return Math.max(food, d.caloriesBurned, 2500);
    })
  );

  const maxStepsInChart = Math.max(...recent7Days.map((d) => Math.max(d.steps, 12000)));

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black font-game text-white tracking-wide">
            CODEX: CHARTS & HISTORY
          </h1>
          <p className="text-xs text-slate-400">
            Monthly progression records, caloric trends, and streak audit
          </p>
        </div>
        <div className="p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>

      {/* 1. MONTHLY HISTORY SUMMARY DASHBOARD */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-game font-bold text-white text-sm">
              Monthly Summary Report (Last 30 Days)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            93% Goal Hit Rate
          </span>
        </div>

        {/* 4 Key Monthly Milestone Cards */}
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Footprints className="w-3.5 h-3.5 text-teal-400" />
              <span>Total Steps</span>
            </div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {totalMonthlySteps.toLocaleString()}
            </div>
            <div className="text-[10px] text-teal-400 font-mono mt-0.5">
              Avg {Math.round(totalMonthlySteps / history.length).toLocaleString()} steps/day
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Total Active Burn</span>
            </div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {totalMonthlyActiveBurn.toLocaleString()} <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-[10px] text-rose-400 font-mono mt-0.5">
              Workouts & locomotion
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Dumbbell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pushups Conquered</span>
            </div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {totalMonthlyPushups.toLocaleString()} <span className="text-xs font-normal text-slate-400">reps</span>
            </div>
            <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
              Disciplined chest volume
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Battle Workouts</span>
            </div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {totalMonthlyWorkouts} <span className="text-xs font-normal text-slate-400">sessions</span>
            </div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">
              Gym, runs, calisthenics
            </div>
          </div>
        </div>
      </div>

      {/* 2. EASY-TO-READ INTERACTIVE CHARTS */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-game font-bold text-white text-sm">Activity & Energy Charts</h3>

          {/* Chart View Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[11px]">
            <button
              onClick={() => setChartView('calories')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                chartView === 'calories' ? 'bg-emerald-500 text-emerald-950 font-black' : 'text-slate-400'
              }`}
            >
              Net Calories
            </button>
            <button
              onClick={() => setChartView('steps')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                chartView === 'steps' ? 'bg-emerald-500 text-emerald-950 font-black' : 'text-slate-400'
              }`}
            >
              Steps
            </button>
          </div>
        </div>

        {/* CALORIE TREND CHART (Consumed vs Burned) */}
        {chartView === 'calories' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Food Ingested
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Active Burn
                </span>
              </div>
              <span>Last 7 Days</span>
            </div>

            {/* Custom SVG / Bar Column Visualization */}
            <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-950/70 rounded-2xl border border-white/5 relative">
              {recent7Days.map((day) => {
                const food = day.meals.reduce((sum, m) => sum + m.calories, 0);
                const burn = day.caloriesBurned;
                const isSelected = day.date === selectedDate;
                const dayLabel = new Date(day.date).toLocaleDateString([], { weekday: 'short' });

                const foodHeightPct = Math.min(100, Math.round((food / maxCaloriesInChart) * 100));
                const burnHeightPct = Math.min(100, Math.round((burn / maxCaloriesInChart) * 100));

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Hover tooltips */}
                    <div className="flex items-end gap-1 w-full justify-center h-32">
                      {/* Food Bar */}
                      <div
                        className="w-3 rounded-t-md bg-amber-400 transition-all group-hover:brightness-125"
                        style={{ height: `${foodHeightPct}%` }}
                        title={`${day.date}: ${food} kcal food`}
                      />
                      {/* Burn Bar */}
                      <div
                        className="w-3 rounded-t-md bg-emerald-400 transition-all group-hover:brightness-125"
                        style={{ height: `${burnHeightPct}%` }}
                        title={`${day.date}: ${burn} kcal active burn`}
                      />
                    </div>

                    <span
                      className={`text-[10px] font-mono mt-2 transition-colors ${
                        isSelected ? 'font-bold text-emerald-400 scale-105' : 'text-slate-400'
                      }`}
                    >
                      {dayLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-center text-slate-400">
              Tap any column to inspect that day's comprehensive battle ledger below
            </p>
          </div>
        )}

        {/* STEPS TREND CHART */}
        {chartView === 'steps' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span className="text-teal-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" /> Daily Steps
              </span>
              <span>10,000 Step Daily Baseline</span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-950/70 rounded-2xl border border-white/5 relative">
              {/* Baseline target rule */}
              <div className="absolute top-[28%] left-2 right-2 border-b border-dashed border-teal-500/40 pointer-events-none flex justify-end">
                <span className="text-[9px] font-mono text-teal-400/80 -mt-3.5">10k Goal</span>
              </div>

              {recent7Days.map((day) => {
                const heightPct = Math.min(100, Math.round((day.steps / maxStepsInChart) * 100));
                const isSelected = day.date === selectedDate;
                const isGoalMet = day.steps >= 10000;
                const dayLabel = new Date(day.date).toLocaleDateString([], { weekday: 'short' });

                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    <div
                      className={`w-6 rounded-t-lg transition-all group-hover:scale-105 ${
                        isGoalMet
                          ? 'bg-gradient-to-t from-teal-600 to-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-700'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />

                    <span
                      className={`text-[10px] font-mono mt-2 transition-colors ${
                        isSelected ? 'font-bold text-teal-400 scale-105' : 'text-slate-400'
                      }`}
                    >
                      {dayLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-center text-slate-400">
              Highlighted in emerald on days where the 10,000 step milestone was conquered
            </p>
          </div>
        )}
      </div>

      {/* 3. INTERACTIVE 30-DAY CALENDAR HEATMAP */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="font-game font-bold text-white text-sm">30-Day Activity Heatmap</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Sept - Oct 2026</span>
        </div>

        {/* 30 Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 p-2 bg-slate-950/70 rounded-2xl border border-white/5 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-slate-500 font-mono py-0.5">
              {d}
            </span>
          ))}

          {history.map((day) => {
            const isSelected = day.date === selectedDate;
            const isGoal = day.goalMet;
            const dayNum = new Date(day.date).getDate();

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 bg-emerald-500/20 shadow-md'
                    : isGoal
                    ? 'bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/50'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-300">{dayNum}</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isGoal ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Goal Conquered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600" /> Rest / Active Recovery
          </span>
        </div>
      </div>

      {/* 4. SELECTED DAY DETAILED AUDIT DRAWER */}
      <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <h3 className="font-game font-bold text-white text-sm">
              Day Audit: <span className="text-emerald-400 font-mono">{currentSelectedDay.date}</span>
            </h3>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-game ${
              selectedNet.status === 'deficit'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {selectedNet.status}
          </span>
        </div>

        {/* Selected Day Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 block">Steps Conquered</span>
            <span className="font-mono font-black text-white text-base">
              {currentSelectedDay.steps.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 block">Active Burn</span>
            <span className="font-mono font-black text-rose-400 text-base">
              {currentSelectedDay.caloriesBurned} kcal
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 block">Net Balance</span>
            <span className="font-mono font-black text-emerald-400 text-base">
              {selectedNet.net > 0 ? `+${selectedNet.net}` : selectedNet.net} kcal
            </span>
          </div>
        </div>

        {/* Workouts on that day */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase font-game block">
            Workouts on {currentSelectedDay.date} ({currentSelectedDay.workouts.length})
          </span>

          {currentSelectedDay.workouts.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No workouts logged on this date.</p>
          ) : (
            currentSelectedDay.workouts.map((w) => (
              <div
                key={w.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{w.activityName}</div>
                  <div className="text-[10px] text-slate-400">
                    {w.durationMinutes} mins • {w.caloriesBurned} kcal burned
                    {w.pushupReps ? ` • ${w.pushupReps} pushups` : ''}
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-amber-400">
                  +{w.xpGained} XP
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. FIREBASE CLOUD REALM & AUTH MANAGEMENT */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-game font-bold text-white text-sm">Firebase Cloud Save & Sync</h3>
              <p className="text-[10px] text-slate-400">Database: ai-studio-apexquestfitness-57ca4607</p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {currentUser ? 'Connected 🟢' : 'Offline ⚪'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {currentUser
            ? `Signed in as ${currentUser.displayName || currentUser.email || 'Guest Warrior'}. Your daily history, workouts, and quest streaks are backed up to Cloud Firestore.`
            : 'Sign in with your Google or Email account to synchronize your progression history across mobile and web devices.'}
        </p>

        <button
          onClick={() => setActiveAuthModal(true)}
          className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black font-game text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
        >
          <Shield className="w-4 h-4" />
          <span>{currentUser ? 'Manage Firebase Account & Cloud Sync' : 'Open Firebase Login Page'}</span>
        </button>
      </div>
    </div>
  );
};
