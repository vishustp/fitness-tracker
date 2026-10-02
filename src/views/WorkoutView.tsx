import React, { useState, useRef, useEffect } from 'react';
import {
  Dumbbell,
  Flame,
  Plus,
  Timer,
  Play,
  CheckCircle,
  Trash2,
  Sparkles,
  Zap,
  Target,
  Layers,
  ChevronDown,
  BookmarkPlus,
  BookOpen,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { GymSet, ActivityCategory, WorkoutRoutineTemplate, GymExerciseLog } from '../types';
import {
  calculatePushupCalories,
  calculateWorkoutCalories,
  formatDuration,
} from '../utils/fitnessCalculations';
import { sounds } from '../utils/soundEffects';
import { BossRaidBannerCard } from '../components/BossRaidBannerCard';
import { WorkoutRoutineRunner } from '../components/WorkoutRoutineRunner';
import { RestIntervalTimer } from '../components/RestIntervalTimer';

export const WorkoutView: React.FC = () => {
  const {
    activityTypes,
    history,
    addWorkout,
    addPushupSession,
    addGymSession,
    createCustomActivity,
    user,
    todayActivity,
  } = useFitness();

  const [activeMode, setActiveMode] = useState<'routines' | 'pushups' | 'gym' | 'custom' | 'history'>('routines');


  // Pushup logger states
  const [pushupTapCount, setPushupTapCount] = useState<number>(0);
  const [pushupManualReps, setPushupManualReps] = useState<number>(30);
  const [pushupStyle, setPushupStyle] = useState<'Standard Military' | 'Diamond Tricep' | 'Wide Chest' | 'Decline Spartan'>('Standard Military');
  const [pushupDuration, setPushupDuration] = useState<number>(12);

  // Gym logger states
  const [gymExerciseName, setGymExerciseName] = useState<string>('Barbell Bench Press');
  const [gymMuscleGroup, setGymMuscleGroup] = useState<string>('Chest');
  const [gymDurationMins, setGymDurationMins] = useState<number>(45);
  const [gymSets, setGymSets] = useState<GymSet[]>([
    { id: '1', setNumber: 1, weightKg: 60, reps: 12, completed: true },
    { id: '2', setNumber: 2, weightKg: 70, reps: 10, completed: true },
    { id: '3', setNumber: 3, weightKg: 80, reps: 8, completed: true },
  ]);

  // Rest timer state
  const [activeGymRestSeconds, setActiveGymRestSeconds] = useState<number | null>(null);

  // Custom Activity creator states
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ActivityCategory>('custom');
  const [customMet, setCustomMet] = useState<number>(7.5);
  const [customDesc, setCustomDesc] = useState('');

  // Selected workout from catalog to log
  const [catalogSelectedId, setCatalogSelectedId] = useState<string>(activityTypes[0]?.id || 'act-pushups');
  const [catalogDuration, setCatalogDuration] = useState<number>(30);
  const [catalogIntensity, setCatalogIntensity] = useState<'light' | 'moderate' | 'vigorous' | 'extreme'>('moderate');

  // Pushup Tap Handler
  const handlePushupTap = () => {
    sounds.playRepCount();
    setPushupTapCount((prev) => prev + 1);
  };

  const handleSavePushups = () => {
    const reps = pushupTapCount > 0 ? pushupTapCount : pushupManualReps;
    if (reps <= 0) return;
    addPushupSession(reps, pushupDuration, `${pushupStyle} form: ${reps} reps.`);
    setPushupTapCount(0);
    setActiveMode('history');
  };

  // Gym Set Handlers
  const handleAddGymSet = () => {
    const nextNum = gymSets.length + 1;
    const last = gymSets[gymSets.length - 1];
    setGymSets([
      ...gymSets,
      {
        id: `${Date.now()}-${nextNum}`,
        setNumber: nextNum,
        weightKg: last ? last.weightKg : 60,
        reps: last ? last.reps : 10,
        completed: true,
      },
    ]);
  };

  const handleToggleSetComplete = (id: string) => {
    setGymSets(
      gymSets.map((s) => {
        if (s.id === id) {
          const nextState = !s.completed;
          if (nextState) {
            sounds.playRepCount();
            setActiveGymRestSeconds(60);
          }
          return { ...s, completed: nextState };
        }
        return s;
      })
    );
  };

  const handleStartRestTimer = (seconds: number) => {
    setActiveGymRestSeconds(seconds);
    sounds.playGemPing();
  };

  const handleSaveGymSession = () => {
    addGymSession(gymExerciseName, gymMuscleGroup, gymSets, gymDurationMins);
    setActiveMode('history');
  };

  const handleLogRoutineFromRunner = (data: {
    routineName: string;
    durationMinutes: number;
    caloriesBurned: number;
    xpGained: number;
    gymExercises: GymExerciseLog[];
    notes: string;
  }) => {
    addWorkout({
      activityId: 'act-gym',
      activityName: data.routineName,
      icon: 'Flame',
      category: 'gym',
      durationMinutes: data.durationMinutes,
      intensity: 'vigorous',
      gymExercises: data.gymExercises,
      notes: data.notes,
    });
    setActiveMode('history');
  };

  const handleSaveCurrentGymAsTemplate = () => {
    try {
      const stored = localStorage.getItem('apexquest_workout_routines_v1');
      const existing: WorkoutRoutineTemplate[] = stored ? JSON.parse(stored) : [];
      const newRoutine: WorkoutRoutineTemplate = {
        id: `rt-custom-${Date.now()}`,
        name: `${gymExerciseName} Protocol`,
        subtitle: `Targeted ${gymMuscleGroup} session`,
        category: gymMuscleGroup.toLowerCase().includes('leg')
          ? 'legs'
          : gymMuscleGroup.toLowerCase().includes('back')
          ? 'pull'
          : 'push',
        estimatedDurationMins: gymDurationMins,
        notes: `Custom routine generated from ${gymExerciseName} (${gymSets.length} sets).`,
        exercises: [
          {
            id: `ex-${Date.now()}`,
            name: gymExerciseName,
            targetMuscle: gymMuscleGroup,
            targetSets: gymSets.length,
            targetReps: gymSets[0]?.reps || 10,
            defaultWeightKg: gymSets[0]?.weightKg || 60,
            restSeconds: 75,
          },
        ],
      };
      localStorage.setItem('apexquest_workout_routines_v1', JSON.stringify([newRoutine, ...existing]));
      sounds.playQuestComplete();
      alert(`Saved "${newRoutine.name}" to your Routine Templates!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Custom Activity Submit
  const handleCreateCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    createCustomActivity({
      name: customName.trim(),
      icon: 'Activity',
      category: customCategory,
      metValue: Number(customMet),
      defaultDurationMinutes: 30,
      caloriesPerMinuteApprox: Math.round(customMet * 1.2 * 10) / 10,
      description: customDesc.trim() || 'Custom athletic discipline.',
    });

    setCustomName('');
    setCustomDesc('');
  };

  // Log Catalog Workout
  const handleLogCatalogWorkout = () => {
    const act = activityTypes.find((a) => a.id === catalogSelectedId);
    if (!act) return;
    addWorkout({
      activityId: act.id,
      activityName: act.name,
      icon: act.icon,
      category: act.category,
      durationMinutes: catalogDuration,
      intensity: catalogIntensity,
      notes: `Dedicated session of ${act.name}.`,
    });
    setActiveMode('history');
  };

  // Total reps & volume calculations
  const totalGymVolume = gymSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  // All historical workouts flattened
  const allWorkouts = history.flatMap((day) => day.workouts);

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black font-game text-white tracking-wide">
            WAR ROOM: WORKOUT LOG
          </h1>
          <p className="text-xs text-slate-400">
            Log pushup counts, indoor gym sets, and custom athletic disciplines
          </p>
        </div>
        <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Dumbbell className="w-5 h-5" />
        </div>
      </div>

      {/* DAILY TITAN BOSS RAID */}
      <BossRaidBannerCard />

      {/* Mode Navigation Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/90 rounded-2xl border border-white/10 text-[11px]">
        <button
          onClick={() => setActiveMode('routines')}
          className={`py-2 px-1.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeMode === 'routines'
              ? 'bg-emerald-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Routines
        </button>

        <button
          onClick={() => setActiveMode('pushups')}
          className={`py-2 px-1.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeMode === 'pushups'
              ? 'bg-emerald-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pushups
        </button>

        <button
          onClick={() => setActiveMode('gym')}
          className={`py-2 px-1.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeMode === 'gym'
              ? 'bg-emerald-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Gym Sets
        </button>

        <button
          onClick={() => setActiveMode('custom')}
          className={`py-2 px-1.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeMode === 'custom'
              ? 'bg-emerald-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Catalog
        </button>

        <button
          onClick={() => setActiveMode('history')}
          className={`py-2 px-1.5 rounded-xl font-bold transition-all cursor-pointer truncate ${
            activeMode === 'history'
              ? 'bg-emerald-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Logs ({allWorkouts.length})
        </button>
      </div>

      {/* 0. WORKOUT ROUTINE RUNNER & CATALOG */}
      {activeMode === 'routines' && (
        <WorkoutRoutineRunner
          userWeightKg={user.weightKg}
          onLogRoutine={handleLogRoutineFromRunner}
        />
      )}

      {/* 1. PUSHUP LOGGING / COUNTER MODE */}
      {activeMode === 'pushups' && (
        <div className="space-y-4">
          {/* Pushup Hero Counter */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border border-emerald-500/30 p-5 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-game uppercase tracking-wider text-emerald-400">
                Interactive Pushup Counter
              </span>
              <span className="text-xs text-slate-400 font-mono">Form: {pushupStyle}</span>
            </div>

            {/* Tap Button Counter */}
            <div className="my-3">
              <div className="text-5xl font-black font-game text-white tracking-tight">
                {pushupTapCount > 0 ? pushupTapCount : pushupManualReps}
                <span className="text-base font-normal text-slate-400 ml-2">REPS</span>
              </div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                ~{calculatePushupCalories(pushupTapCount > 0 ? pushupTapCount : pushupManualReps, user.weightKg)} Calories Burned
              </p>
            </div>

            {/* Big Interactive Tap Circle */}
            <div className="py-2">
              <button
                onClick={handlePushupTap}
                className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-1 shadow-2xl shadow-emerald-500/40 active:scale-90 transition-transform cursor-pointer flex items-center justify-center group"
              >
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-white">
                  <Dumbbell className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-xs font-black font-game text-emerald-300">TAP EACH REP</span>
                </div>
              </button>
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={() => setPushupTapCount(0)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline font-mono"
                >
                  Reset Counter
                </button>
              </div>
            </div>

            {/* Manual Rep Slider Fallback */}
            <div className="mt-4 pt-4 border-t border-white/5 text-left">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400">Or Adjust Rep Target:</span>
                <span className="font-mono font-bold text-white">{pushupManualReps} reps</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={pushupManualReps}
                onChange={(e) => {
                  setPushupManualReps(Number(e.target.value));
                  setPushupTapCount(0);
                }}
                aria-label="Adjust pushup rep target"
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Form Variation Picker */}
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase font-game block mb-2">
              Select Pushup Variation
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { name: 'Standard Military', desc: 'Even chest, shoulders & triceps' },
                { name: 'Diamond Tricep', desc: 'Intense medial tricep focus' },
                { name: 'Wide Chest', desc: 'Maximum pectoral stretch & activation' },
                { name: 'Decline Spartan', desc: 'Upper chest & anterior deltoid dominance' },
              ].map((style) => (
                <button
                  key={style.name}
                  onClick={() => setPushupStyle(style.name as typeof pushupStyle)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    pushupStyle === style.name
                      ? 'bg-emerald-500/20 border-emerald-500 text-white'
                      : 'bg-slate-950/70 border-white/5 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{style.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSavePushups}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
            >
              Record {pushupTapCount > 0 ? pushupTapCount : pushupManualReps} Pushups (+{Math.round((pushupTapCount > 0 ? pushupTapCount : pushupManualReps) * 3 + 30)} XP)
            </button>
          </div>
        </div>
      )}

      {/* 2. INDOOR GYM WORKOUT LOGGER */}
      {activeMode === 'gym' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-game font-bold text-white text-base">Indoor Gym Session</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {gymSets.length} Sets Tracked
              </span>
            </div>

            {/* Exercise Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase font-game block mb-1">
                Exercise Selection
              </label>
              <select
                value={gymExerciseName}
                onChange={(e) => {
                  setGymExerciseName(e.target.value);
                  if (e.target.value.includes('Squat') || e.target.value.includes('Leg')) setGymMuscleGroup('Legs');
                  else if (e.target.value.includes('Press') || e.target.value.includes('Bench')) setGymMuscleGroup('Chest');
                  else if (e.target.value.includes('Pull') || e.target.value.includes('Deadlift')) setGymMuscleGroup('Back');
                  else setGymMuscleGroup('Arms');
                }}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Barbell Bench Press">Barbell Bench Press (Chest)</option>
                <option value="Incline Dumbbell Press">Incline Dumbbell Press (Upper Chest)</option>
                <option value="Barbell Back Squats">Barbell Back Squats (Quads & Glutes)</option>
                <option value="Romanian Deadlifts">Romanian Deadlifts (Hamstrings & Posterior)</option>
                <option value="Standing Overhead Press">Standing Overhead Press (Shoulders)</option>
                <option value="Wide Grip Lat Pulldown">Wide Grip Lat Pulldown (Back)</option>
                <option value="Seated Cable Rows">Seated Cable Rows (Mid-Back)</option>
                <option value="EZ-Bar Bicep Curls">EZ-Bar Bicep Curls (Biceps)</option>
                <option value="Tricep Rope Pushdowns">Tricep Rope Pushdowns (Triceps)</option>
                <option value="Leg Press Heavy">Leg Press Heavy (Legs)</option>
              </select>
            </div>

            {/* Rest Timer Widget */}
            {activeGymRestSeconds !== null ? (
              <RestIntervalTimer
                totalSeconds={activeGymRestSeconds}
                title={`Rest between ${gymExerciseName} sets`}
                onCancel={() => setActiveGymRestSeconds(null)}
                onFinish={() => setActiveGymRestSeconds(null)}
              />
            ) : (
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Inter-Set Rest Timer</div>
                    <div className="text-[10px] text-slate-400">
                      Tap duration to start countdown
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[30, 60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => handleStartRestTimer(sec)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-[11px] font-mono font-bold text-emerald-400 transition-colors cursor-pointer min-h-[36px]"
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Set Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-2 font-game">
                <span className="w-8">SET</span>
                <span className="flex-1 text-center">WEIGHT (KG)</span>
                <span className="w-16 text-center">REPS</span>
                <span className="w-10 text-right">DONE</span>
              </div>

              {gymSets.map((s, idx) => (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                    s.completed ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-950 border-white/5'
                  }`}
                >
                  <span className="w-8 font-mono font-bold text-emerald-400 text-center">#{idx + 1}</span>

                  <div className="flex-1 flex justify-center">
                    <input
                      type="number"
                      value={s.weightKg}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGymSets(gymSets.map((item) => (item.id === s.id ? { ...item, weightKg: val } : item)));
                      }}
                      className="w-20 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                      min="0"
                      step="2.5"
                    />
                  </div>

                  <div className="w-16 flex justify-center">
                    <input
                      type="number"
                      value={s.reps}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGymSets(gymSets.map((item) => (item.id === s.id ? { ...item, reps: val } : item)));
                      }}
                      className="w-14 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs"
                      min="1"
                    />
                  </div>

                  <div className="w-10 flex justify-end">
                    <button
                      onClick={() => handleToggleSetComplete(s.id)}
                      aria-label="Toggle set completion"
                      className={`p-1.5 min-h-[36px] min-w-[36px] rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                        s.completed ? 'bg-emerald-500 text-emerald-950 font-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddGymSet}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Set #{gymSets.length + 1}</span>
              </button>
            </div>

            {/* Total Tonnage Lifted */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Session Tonnage</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {totalGymVolume.toLocaleString()} kg lifted
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Est. Calorie Burn</span>
                <span className="font-mono text-amber-400 font-bold text-sm">
                  ~{calculateWorkoutCalories(6.5, gymDurationMins, user.weightKg, 'vigorous')} kcal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveGymSession}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all min-h-[44px]"
              >
                Complete & Log Gym Workout (+280 XP)
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentGymAsTemplate}
                title="Save current exercise & sets as reusable Routine Template"
                aria-label="Save as Routine Template"
                className="py-3.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-400 text-xs font-bold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Save Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CUSTOM ACTIVITY CREATOR & CATALOG */}
      {activeMode === 'custom' && (
        <div className="space-y-4">
          {/* Quick Launch From Catalog */}
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
            <h3 className="font-game font-bold text-white text-base">Select Activity to Log</h3>

            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {activityTypes.map((act) => {
                const isSel = catalogSelectedId === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => setCatalogSelectedId(act.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSel
                        ? 'bg-emerald-500/20 border-emerald-500 text-white'
                        : 'bg-slate-950/70 border-white/5 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">{act.name}</span>
                      {act.isCustom && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      MET {act.metValue} • ~{Math.round(act.metValue * 1.15 * user.weightKg / 20)} kcal/10m
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Duration and Intensity */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                <label htmlFor="workout-catalog-duration" className="text-[10px] text-slate-400 block mb-1">Duration (Mins)</label>
                <input
                  id="workout-catalog-duration"
                  type="number"
                  value={catalogDuration}
                  onChange={(e) => setCatalogDuration(Number(e.target.value))}
                  aria-label="Workout duration in minutes"
                  className="w-full bg-transparent font-mono font-bold text-white text-sm"
                  min="5"
                  max="180"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
                <label htmlFor="workout-catalog-intensity" className="text-[10px] text-slate-400 block mb-1">Intensity</label>
                <select
                  id="workout-catalog-intensity"
                  value={catalogIntensity}
                  onChange={(e) => setCatalogIntensity(e.target.value as typeof catalogIntensity)}
                  aria-label="Workout intensity level"
                  className="w-full bg-transparent font-bold text-white text-xs capitalize focus:outline-none"
                >
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="vigorous">Vigorous</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleLogCatalogWorkout}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md transition-colors cursor-pointer"
            >
              Log Workout Now
            </button>
          </div>

          {/* Create New Custom Activity Form */}
          <form
            onSubmit={handleCreateCustomActivity}
            className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-game font-bold text-white text-sm">Create New Custom Activity</h4>
            </div>

            <div>
              <label htmlFor="custom-act-name" className="text-[10px] text-slate-400 block mb-1">Activity Name</label>
              <input
                id="custom-act-name"
                type="text"
                placeholder="e.g. Brazilian Jiu-Jitsu, Rock Climbing, Padel"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                aria-label="Custom activity name"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label htmlFor="custom-act-category" className="text-[10px] text-slate-400 block mb-1">Category</label>
                <select
                  id="custom-act-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as ActivityCategory)}
                  aria-label="Custom activity category"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white capitalize focus:outline-none focus:border-emerald-500"
                >
                  <option value="cardio">Cardio / Endurance</option>
                  <option value="gym">Strength & Weights</option>
                  <option value="hiit">HIIT & Plyometrics</option>
                  <option value="pushups">Bodyweight & Calisthenics</option>
                  <option value="flexibility">Flexibility & Core</option>
                  <option value="custom">Other / Martial Arts</option>
                </select>
              </div>

              <div>
                <label htmlFor="custom-act-met" className="text-[10px] text-slate-400 block mb-1">MET Intensity Burn (3 - 14)</label>
                <input
                  id="custom-act-met"
                  type="number"
                  step="0.5"
                  min="2"
                  max="16"
                  value={customMet}
                  onChange={(e) => setCustomMet(Number(e.target.value))}
                  aria-label="MET Intensity Burn value"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="custom-act-desc" className="text-[10px] text-slate-400 block mb-1">Goal Focus Description</label>
              <input
                id="custom-act-desc"
                type="text"
                placeholder="Target muscle or athletic goal"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                aria-label="Custom activity description"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add to Permanent Activity Catalog</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. WORKOUT HISTORY FEED */}
      {activeMode === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Showing recent battle workouts</span>
            <span className="font-mono text-emerald-400 font-bold">{allWorkouts.length} logged</span>
          </div>

          {allWorkouts.slice(0, 15).map((w) => (
            <div
              key={w.id}
              className="rounded-2xl bg-slate-900/90 border border-white/10 p-3.5 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">{w.activityName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {w.date} • {formatDuration(w.durationMinutes)} • {w.intensity}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 text-sm block">
                    {w.caloriesBurned} kcal
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">+{w.xpGained} XP</span>
                </div>
              </div>

              {w.notes && (
                <p className="text-[11px] text-slate-300 bg-white/5 p-2 rounded-xl border border-white/5">
                  "{w.notes}"
                </p>
              )}

              {/* Gym exercises details if any */}
              {w.gymExercises && w.gymExercises.length > 0 && (
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-game">
                    Set Breakdown
                  </span>
                  {w.gymExercises.map((ge) => (
                    <div key={ge.id}>
                      <span className="text-[11px] font-semibold text-emerald-300">{ge.exerciseName}: </span>
                      <span className="text-[11px] text-slate-300 font-mono">
                        {ge.sets.map((s) => `${s.weightKg}kg × ${s.reps}`).join(' | ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
