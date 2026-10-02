import React, { useState } from 'react';
import {
  X,
  Dumbbell,
  Flame,
  UtensilsCrossed,
  Footprints,
  Plus,
  Trash2,
  CheckCircle,
  Timer,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { GymSet } from '../types';
import { calculatePushupCalories, calculateWorkoutCalories } from '../utils/fitnessCalculations';
import { sounds } from '../utils/soundEffects';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export const QuickLogSheet: React.FC = () => {
  const {
    activeQuickLogModal,
    setActiveQuickLogModal,
    activityTypes,
    addWorkout,
    addPushupSession,
    addGymSession,
    addMeal,
    updateTodaySteps,
    user,
  } = useFitness();

  const { dialogRef } = useDialogAccessibility({
    isOpen: Boolean(activeQuickLogModal),
    onClose: () => setActiveQuickLogModal(null),
  });

  const [activeTab, setActiveTab] = useState<'pushups' | 'gym' | 'workout' | 'meal' | 'steps'>('pushups');

  // Pushup states
  const [pushupReps, setPushupReps] = useState<number>(25);
  const [pushupLiveCount, setPushupLiveCount] = useState<number>(0);
  const [isCounterActive, setIsCounterActive] = useState<boolean>(false);
  const [pushupMinutes, setPushupMinutes] = useState<number>(10);

  // Gym states
  const [gymExercise, setGymExercise] = useState<string>('Barbell Bench Press');
  const [gymTargetMuscle, setGymTargetMuscle] = useState<string>('Chest');
  const [gymDuration, setGymDuration] = useState<number>(45);
  const [gymSets, setGymSets] = useState<GymSet[]>([
    { id: '1', setNumber: 1, weightKg: 60, reps: 10, completed: true },
    { id: '2', setNumber: 2, weightKg: 65, reps: 8, completed: true },
    { id: '3', setNumber: 3, weightKg: 70, reps: 6, completed: true },
  ]);

  // Workout states
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activityTypes[0]?.id || 'act-pushups');
  const [workoutDuration, setWorkoutDuration] = useState<number>(30);
  const [workoutIntensity, setWorkoutIntensity] = useState<'light' | 'moderate' | 'vigorous' | 'extreme'>('moderate');
  const [workoutNotes, setWorkoutNotes] = useState<string>('');

  // Meal states
  const [mealName, setMealName] = useState<string>('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [mealCalories, setMealCalories] = useState<number>(550);
  const [mealProtein, setMealProtein] = useState<number>(40);
  const [mealCarbs, setMealCarbs] = useState<number>(55);
  const [mealFat, setMealFat] = useState<number>(14);

  // Steps state
  const [stepAdd, setStepAdd] = useState<number>(1500);

  // Synchronize initial active tab with context request
  React.useEffect(() => {
    if (activeQuickLogModal && activeQuickLogModal !== 'custom') {
      setActiveTab(activeQuickLogModal as 'pushups' | 'gym' | 'workout' | 'meal');
    }
  }, [activeQuickLogModal]);

  if (!activeQuickLogModal) return null;

  // Preset exercises for Gym
  const gymPresets = [
    { name: 'Barbell Bench Press', muscle: 'Chest' },
    { name: 'Barbell Back Squats', muscle: 'Quads & Glutes' },
    { name: 'Romanian Deadlifts', muscle: 'Hamstrings & Back' },
    { name: 'Incline Dumbbell Press', muscle: 'Upper Chest' },
    { name: 'Overhead Shoulder Press', muscle: 'Deltoids' },
    { name: 'Wide Grip Lat Pulldown', muscle: 'Lats & Back' },
    { name: 'Barbell Bicep Curls', muscle: 'Biceps' },
    { name: 'Dumbbell Hammer Curls', muscle: 'Forearms & Biceps' },
    { name: 'Cable Tricep Pushdowns', muscle: 'Triceps' },
    { name: 'Leg Press & Calf Raises', muscle: 'Lower Body' },
  ];

  // Indian Meal Presets
  const mealPresets = [
    { name: 'Paneer Butter Masala & 2 Rotis', cal: 520, p: 24, c: 52, f: 22, type: 'dinner' as const },
    { name: 'Dal Tadka with Steamed Rice', cal: 440, p: 18, c: 72, f: 8, type: 'lunch' as const },
    { name: 'Hyderabadi Chicken Biryani', cal: 680, p: 42, c: 74, f: 22, type: 'lunch' as const },
    { name: 'Steamed Idli Sambar (3 pcs)', cal: 310, p: 14, c: 58, f: 4, type: 'breakfast' as const },
    { name: 'Rajma Chawal with Salad', cal: 490, p: 22, c: 78, f: 9, type: 'lunch' as const },
    { name: 'Indori Poha with Peanuts', cal: 340, p: 10, c: 54, f: 10, type: 'breakfast' as const },
  ];

  // Handlers
  const handlePushupTap = () => {
    sounds.playRepCount();
    setPushupLiveCount((prev) => prev + 1);
  };

  const handleSavePushups = () => {
    const total = isCounterActive ? pushupLiveCount : pushupReps;
    if (total <= 0) return;
    addPushupSession(total, pushupMinutes, `Completed ${total} disciplined pushup reps.`);
    setActiveQuickLogModal(null);
  };

  const handleAddGymSet = () => {
    const nextNum = gymSets.length + 1;
    const lastSet = gymSets[gymSets.length - 1];
    setGymSets([
      ...gymSets,
      {
        id: `${Date.now()}-${nextNum}`,
        setNumber: nextNum,
        weightKg: lastSet ? lastSet.weightKg : 50,
        reps: lastSet ? lastSet.reps : 10,
        completed: true,
      },
    ]);
  };

  const handleRemoveGymSet = (id: string) => {
    if (gymSets.length <= 1) return;
    setGymSets(gymSets.filter((s) => s.id !== id));
  };

  const handleSaveGymSession = () => {
    addGymSession(gymExercise, gymTargetMuscle, gymSets, gymDuration);
    setActiveQuickLogModal(null);
  };

  const handleSaveWorkout = () => {
    const actDef = activityTypes.find((a) => a.id === selectedActivityId);
    if (!actDef) return;
    addWorkout({
      activityId: actDef.id,
      activityName: actDef.name,
      icon: actDef.icon,
      category: actDef.category,
      durationMinutes: workoutDuration,
      intensity: workoutIntensity,
      notes: workoutNotes || `Completed ${workoutDuration}m of ${actDef.name}.`,
    });
    setActiveQuickLogModal(null);
  };

  const handleSaveMeal = () => {
    if (!mealName.trim()) return;
    const now = new Date();
    addMeal({
      name: mealName.trim(),
      mealType,
      calories: Number(mealCalories),
      proteinG: Number(mealProtein),
      carbsG: Number(mealCarbs),
      fatG: Number(mealFat),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setActiveQuickLogModal(null);
  };

  const handleAddSteps = () => {
    updateTodaySteps(stepAdd);
    setActiveQuickLogModal(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quicklog-sheet-title"
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-[36px] sm:rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Android Sheet drag handle */}
        <div className="w-12 h-1 rounded-full bg-slate-700 mx-auto mb-3 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 id="quicklog-sheet-title" className="font-game font-bold text-white text-base">Quick Fitness Logger</h3>
              <p className="text-[11px] text-slate-400">Track pushups, gym sets, meals, or custom activities</p>
            </div>
          </div>
          <button
            onClick={() => setActiveQuickLogModal(null)}
            aria-label="Close fitness logger sheet"
            className="p-1 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
          {[
            { id: 'pushups', label: 'Pushups', icon: Dumbbell },
            { id: 'gym', label: 'Gym Sets', icon: Flame },
            { id: 'workout', label: 'Activity', icon: Sparkles },
            { id: 'meal', label: 'Food Log', icon: UtensilsCrossed },
            { id: 'steps', label: 'Steps', icon: Footprints },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-1.5 px-3 min-h-[36px] rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isSel
                    ? 'bg-emerald-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-4">
          {/* PUSHUPS TAB */}
          {activeTab === 'pushups' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={() => setIsCounterActive(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      !isCounterActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400'
                    }`}
                  >
                    Quick Number
                  </button>
                  <button
                    onClick={() => setIsCounterActive(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isCounterActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400'
                    }`}
                  >
                    Live Tap Counter
                  </button>
                </div>

                {isCounterActive ? (
                  <div className="py-4">
                    <div className="text-4xl font-black font-game text-emerald-400 mb-2">
                      {pushupLiveCount} <span className="text-sm font-normal text-slate-400">REPS</span>
                    </div>
                    <button
                      onClick={handlePushupTap}
                      className="w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-1 shadow-xl shadow-emerald-500/30 active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
                    >
                      <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-white">
                        <Dumbbell className="w-7 h-7 text-emerald-400 mb-1" />
                        <span className="text-xs font-bold font-game uppercase">TAP REP</span>
                      </div>
                    </button>
                    <p className="text-[11px] text-slate-400 mt-3">Tap every time your chest touches the floor</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-black font-game text-white mb-2">
                      {pushupReps} <span className="text-sm font-normal text-slate-400">Reps</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={pushupReps}
                      onChange={(e) => setPushupReps(Number(e.target.value))}
                      aria-label="Pushup repetition target"
                      className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                      <span>5 reps</span>
                      <span>50 reps</span>
                      <span>150 reps</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pushup Stats Preview */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Est. Calories:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ~{calculatePushupCalories(isCounterActive ? pushupLiveCount : pushupReps, user.weightKg)} kcal
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">XP Bounty:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    +{Math.round((isCounterActive ? pushupLiveCount : pushupReps) * 3 + 40)} XP
                  </span>
                </div>
              </div>

              <button
                onClick={handleSavePushups}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
              >
                Log {isCounterActive ? pushupLiveCount : pushupReps} Pushups to Quest
              </button>
            </div>
          )}

          {/* GYM TAB */}
          {activeTab === 'gym' && (
            <div className="space-y-3">
              {/* Exercise Picker */}
              <div>
                <label htmlFor="quicklog-gym-exercise" className="text-[11px] font-semibold text-slate-400 uppercase font-game block mb-1">
                  Exercise Name
                </label>
                <div className="flex gap-2">
                  <select
                    id="quicklog-gym-exercise"
                    value={gymExercise}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setGymExercise(sel);
                      const match = gymPresets.find((p) => p.name === sel);
                      if (match) setGymTargetMuscle(match.muscle);
                    }}
                    aria-label="Select gym exercise"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {gymPresets.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({p.muscle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5 text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  Gym Duration (Mins)
                </span>
                <div className="flex items-center gap-2">
                  {[30, 45, 60, 75].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGymDuration(m)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        gymDuration === m ? 'bg-emerald-500 text-emerald-950 font-black' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Tracker Table */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 font-game">
                  <span>SET</span>
                  <span>WEIGHT (KG)</span>
                  <span>REPS</span>
                  <span>ACTION</span>
                </div>

                {gymSets.map((set, idx) => (
                  <div key={set.id} className="flex items-center justify-between gap-2 bg-white/5 p-2 rounded-xl text-xs">
                    <span className="w-8 font-mono font-bold text-emerald-400 text-center">#{idx + 1}</span>

                    <input
                      type="number"
                      value={set.weightKg}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGymSets(gymSets.map((s) => (s.id === set.id ? { ...s, weightKg: val } : s)));
                      }}
                      aria-label={`Set ${idx + 1} weight in kg`}
                      className="w-20 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-white text-xs"
                      min="0"
                      step="2.5"
                    />

                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGymSets(gymSets.map((s) => (s.id === set.id ? { ...s, reps: val } : s)));
                      }}
                      aria-label={`Set ${idx + 1} repetition count`}
                      className="w-16 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-white text-xs"
                      min="1"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveGymSet(set.id)}
                      aria-label="Remove gym set"
                      className="p-1 min-h-[36px] min-w-[36px] rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddGymSet}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Another Set</span>
                </button>
              </div>

              {/* Tonnage summary */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Volume Lifted:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {gymSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0).toLocaleString()} kg volume
                </span>
              </div>

              <button
                onClick={handleSaveGymSession}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
              >
                Log Gym Workout & Earn XP
              </button>
            </div>
          )}

          {/* GENERAL WORKOUT TAB */}
          {activeTab === 'workout' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase font-game block mb-1">
                  Choose Activity Type
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {activityTypes.map((act) => {
                    const isSel = selectedActivityId === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setSelectedActivityId(act.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                          isSel
                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                            : 'bg-slate-950/60 border-white/5 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="p-1 rounded-lg bg-white/5 text-emerald-400 shrink-0">
                          <Flame className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{act.name}</div>
                          <div className="text-[10px] text-slate-400">MET {act.metValue} • {act.category}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Slider */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{workoutDuration} mins</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(Number(e.target.value))}
                  aria-label="Workout duration in minutes"
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Intensity Picker */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase font-game block mb-1">
                  Intensity
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['light', 'moderate', 'vigorous', 'extreme'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setWorkoutIntensity(lvl)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] capitalize font-semibold transition-all cursor-pointer ${
                        workoutIntensity === lvl
                          ? 'bg-emerald-500 text-emerald-950 font-black'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workout Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Workout notes or reflections (optional)"
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  aria-label="Workout notes and reflection"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleSaveWorkout}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
              >
                Log Activity & Award XP
              </button>
            </div>
          )}

          {/* MEAL TAB */}
          {activeTab === 'meal' && (
            <div className="space-y-3">
              {/* Presets */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase font-game block mb-1">
                  Popular Indian Meal Presets
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {mealPresets.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setMealName(p.name);
                        setMealCalories(p.cal);
                        setMealProtein(p.p);
                        setMealCarbs(p.c);
                        setMealFat(p.f);
                        setMealType(p.type);
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-white/10 text-left shrink-0 max-w-[160px] hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{p.cal} kcal • {p.p}g P</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Name & Type */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label htmlFor="quicklog-meal-name" className="text-[10px] text-slate-400 block mb-1">Food / Meal Name</label>
                  <input
                    id="quicklog-meal-name"
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="e.g. Steak & Sweet Potato"
                    aria-label="Food or meal name"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="quicklog-meal-type" className="text-[10px] text-slate-400 block mb-1">Meal Type</label>
                  <select
                    id="quicklog-meal-type"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as typeof mealType)}
                    aria-label="Meal type category"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white capitalize focus:outline-none focus:border-emerald-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>

              {/* Macros input grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                  <label htmlFor="quicklog-calories" className="text-[10px] text-amber-400 block font-bold cursor-pointer">Calories</label>
                  <input
                    id="quicklog-calories"
                    type="number"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(Number(e.target.value))}
                    aria-label="Calories in kcal"
                    className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                  />
                </div>

                <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                  <label htmlFor="quicklog-protein" className="text-[10px] text-emerald-400 block font-bold cursor-pointer">Protein (g)</label>
                  <input
                    id="quicklog-protein"
                    type="number"
                    value={mealProtein}
                    onChange={(e) => setMealProtein(Number(e.target.value))}
                    aria-label="Protein in grams"
                    className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                  />
                </div>

                <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                  <label htmlFor="quicklog-carbs" className="text-[10px] text-cyan-400 block font-bold cursor-pointer">Carbs (g)</label>
                  <input
                    id="quicklog-carbs"
                    type="number"
                    value={mealCarbs}
                    onChange={(e) => setMealCarbs(Number(e.target.value))}
                    aria-label="Carbohydrates in grams"
                    className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                  />
                </div>

                <div className="bg-slate-950 p-2 rounded-xl border border-white/10 text-center">
                  <label htmlFor="quicklog-fat" className="text-[10px] text-rose-400 block font-bold cursor-pointer">Fat (g)</label>
                  <input
                    id="quicklog-fat"
                    type="number"
                    value={mealFat}
                    onChange={(e) => setMealFat(Number(e.target.value))}
                    aria-label="Fat in grams"
                    className="w-full bg-transparent text-center font-mono font-bold text-white text-xs mt-1"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveMeal}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
              >
                Log Meal to Net Calorie Ledger
              </button>
            </div>
          )}

          {/* STEPS TAB */}
          {activeTab === 'steps' && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5">
                <Footprints className="w-10 h-10 text-teal-400 mx-auto mb-2 animate-pulse" />
                <div className="text-3xl font-black font-game text-white mb-2">
                  +{stepAdd.toLocaleString()} <span className="text-sm font-normal text-slate-400">Steps</span>
                </div>
                <div className="flex justify-center gap-2 my-3">
                  {[500, 1000, 2500, 5000].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStepAdd(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-colors cursor-pointer ${
                        stepAdd === s ? 'bg-teal-500 text-teal-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddSteps}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
              >
                Sync Steps to Today's Total
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
