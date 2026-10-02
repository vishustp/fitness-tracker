import React, { useState } from 'react';
import {
  Dumbbell,
  Play,
  CheckCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Flame,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  Check,
  X,
} from 'lucide-react';
import {
  WorkoutRoutineTemplate,
  WorkoutRoutineExercise,
  GymSet,
  GymExerciseLog,
} from '../types';
import { defaultWorkoutRoutines } from '../data/routineData';
import {
  calculateTotalVolumeKg,
  countCompletedSets,
  estimateRoutineCalories,
  calculateRoutineXp,
  RoutineExerciseRecord,
} from '../utils/routineCalculations';
import { RestIntervalTimer } from './RestIntervalTimer';
import { sounds } from '../utils/soundEffects';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface WorkoutRoutineRunnerProps {
  userWeightKg: number;
  onLogRoutine: (data: {
    routineName: string;
    durationMinutes: number;
    caloriesBurned: number;
    xpGained: number;
    gymExercises: GymExerciseLog[];
    notes: string;
  }) => void;
  onSaveSessionAsRoutine?: (routine: WorkoutRoutineTemplate) => void;
}

interface ActiveExerciseSession {
  exerciseId: string;
  name: string;
  targetMuscle: string;
  restSeconds: number;
  sets: {
    id: string;
    setNumber: number;
    weightKg: number;
    reps: number;
    completed: boolean;
  }[];
}

export const WorkoutRoutineRunner: React.FC<WorkoutRoutineRunnerProps> = ({
  userWeightKg,
  onLogRoutine,
}) => {
  // Load saved routines from localStorage
  const [routines, setRoutines] = useState<WorkoutRoutineTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('apexquest_workout_routines_v1');
      return stored ? JSON.parse(stored) : defaultWorkoutRoutines;
    } catch {
      return defaultWorkoutRoutines;
    }
  });

  const saveRoutines = (updated: WorkoutRoutineTemplate[]) => {
    setRoutines(updated);
    try {
      localStorage.setItem('apexquest_workout_routines_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutineTemplate | null>(null);
  const [activeSessionExercises, setActiveSessionExercises] = useState<ActiveExerciseSession[] | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState<number>(0);
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);
  const [activeRestTitle, setActiveRestTitle] = useState<string>('Rest Interval');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Custom routine modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineSubtitle, setNewRoutineSubtitle] = useState('');
  const [newRoutineCategory, setNewRoutineCategory] = useState<WorkoutRoutineTemplate['category']>('push');
  const [newRoutineDuration, setNewRoutineDuration] = useState(45);
  const [newRoutineExercises, setNewRoutineExercises] = useState<WorkoutRoutineExercise[]>([
    {
      id: `ex-${Date.now()}-1`,
      name: 'Flat Barbell Bench Press',
      targetMuscle: 'Chest',
      targetSets: 3,
      targetReps: 10,
      defaultWeightKg: 60,
      restSeconds: 90,
    },
  ]);

  const { dialogRef: createModalRef } = useDialogAccessibility<HTMLFormElement>({
    isOpen: showCreateModal,
    onClose: () => setShowCreateModal(false),
  });

  // Start Interactive Routine Session
  const handleStartSession = (routine: WorkoutRoutineTemplate) => {
    const initialized: ActiveExerciseSession[] = routine.exercises.map((ex) => ({
      exerciseId: ex.id,
      name: ex.name,
      targetMuscle: ex.targetMuscle,
      restSeconds: ex.restSeconds,
      sets: Array.from({ length: ex.targetSets }, (_, i) => ({
        id: `set-${ex.id}-${i + 1}`,
        setNumber: i + 1,
        weightKg: ex.defaultWeightKg,
        reps: ex.targetReps,
        completed: false,
      })),
    }));

    setActiveSessionExercises(initialized);
    setSelectedRoutine(routine);
    setCurrentExerciseIdx(0);
    setActiveRestSeconds(null);
    setSessionStartTime(Date.now());
    sounds.playGemPing();
  };

  // Toggle set completion & auto-trigger rest countdown
  const handleToggleSetComplete = (setIndex: number) => {
    if (!activeSessionExercises) return;

    const currentEx = activeSessionExercises[currentExerciseIdx];
    const targetSet = currentEx.sets[setIndex];
    const nextCompleted = !targetSet.completed;

    const updatedExercises = activeSessionExercises.map((ex, exIdx) => {
      if (exIdx !== currentExerciseIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, sIdx) => {
          if (sIdx === setIndex) {
            return { ...s, completed: nextCompleted };
          }
          return s;
        }),
      };
    });

    setActiveSessionExercises(updatedExercises);

    if (nextCompleted) {
      sounds.playRepCount();
      // Auto-trigger rest countdown for current exercise
      setActiveRestTitle(`Rest after Set #${targetSet.setNumber} (${currentEx.name})`);
      setActiveRestSeconds(currentEx.restSeconds);
    }
  };

  const handleUpdateSetWeight = (setIndex: number, weightKg: number) => {
    if (!activeSessionExercises) return;
    setActiveSessionExercises(
      activeSessionExercises.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => (sIdx === setIndex ? { ...s, weightKg } : s)),
        };
      })
    );
  };

  const handleUpdateSetReps = (setIndex: number, reps: number) => {
    if (!activeSessionExercises) return;
    setActiveSessionExercises(
      activeSessionExercises.map((ex, exIdx) => {
        if (exIdx !== currentExerciseIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => (sIdx === setIndex ? { ...s, reps } : s)),
        };
      })
    );
  };

  // Finish Routine & Save
  const handleFinishRoutine = () => {
    if (!activeSessionExercises || !selectedRoutine) return;

    const elapsedMinutes = sessionStartTime
      ? Math.max(15, Math.round((Date.now() - sessionStartTime) / 60000))
      : selectedRoutine.estimatedDurationMins;

    const totalVolume = calculateTotalVolumeKg(activeSessionExercises);
    const completedSetsCount = countCompletedSets(activeSessionExercises);
    const caloriesBurned = estimateRoutineCalories(elapsedMinutes, userWeightKg, 'vigorous');
    const xpGained = calculateRoutineXp(elapsedMinutes, completedSetsCount, totalVolume);

    const gymExercises: GymExerciseLog[] = activeSessionExercises.map((ex) => ({
      id: `gel-${Date.now()}-${ex.exerciseId}`,
      exerciseName: ex.name,
      targetMuscle: ex.targetMuscle,
      sets: ex.sets.map((s) => ({
        id: s.id,
        setNumber: s.setNumber,
        weightKg: s.weightKg,
        reps: s.reps,
        completed: s.completed,
      })),
    }));

    onLogRoutine({
      routineName: selectedRoutine.name,
      durationMinutes: elapsedMinutes,
      caloriesBurned,
      xpGained,
      gymExercises,
      notes: `Completed ${selectedRoutine.name}: ${completedSetsCount} sets finished, ${totalVolume.toLocaleString()} kg cumulative volume.`,
    });

    sounds.playQuestComplete();
    setActiveSessionExercises(null);
    setSelectedRoutine(null);
    setActiveRestSeconds(null);
  };

  // Quick Log without interactive runner
  const handleQuickLogRoutine = (routine: WorkoutRoutineTemplate) => {
    const elapsedMinutes = routine.estimatedDurationMins;
    const routineRecords: RoutineExerciseRecord[] = routine.exercises.map((ex) => ({
      name: ex.name,
      targetMuscle: ex.targetMuscle,
      sets: Array.from({ length: ex.targetSets }, () => ({
        weightKg: ex.defaultWeightKg,
        reps: ex.targetReps,
        completed: true,
      })),
    }));

    const totalVolume = calculateTotalVolumeKg(routineRecords);
    const completedSetsCount = countCompletedSets(routineRecords);
    const caloriesBurned = estimateRoutineCalories(elapsedMinutes, userWeightKg, 'vigorous');
    const xpGained = calculateRoutineXp(elapsedMinutes, completedSetsCount, totalVolume);

    const gymExercises: GymExerciseLog[] = routine.exercises.map((ex) => ({
      id: `gel-${Date.now()}-${ex.id}`,
      exerciseName: ex.name,
      targetMuscle: ex.targetMuscle,
      sets: Array.from({ length: ex.targetSets }, (_, i) => ({
        id: `set-${ex.id}-${i + 1}`,
        setNumber: i + 1,
        weightKg: ex.defaultWeightKg,
        reps: ex.targetReps,
        completed: true,
      })),
    }));

    onLogRoutine({
      routineName: routine.name,
      durationMinutes: elapsedMinutes,
      caloriesBurned,
      xpGained,
      gymExercises,
      notes: `Quick Log: Completed all ${completedSetsCount} sets of ${routine.name} (${totalVolume.toLocaleString()} kg volume).`,
    });

    sounds.playQuestComplete();
  };

  // Delete custom routine
  const handleDeleteRoutine = (id: string) => {
    const next = routines.filter((r) => r.id !== id);
    saveRoutines(next);
  };

  // Create routine submit
  const handleCreateRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim() || newRoutineExercises.length === 0) return;

    const newTemplate: WorkoutRoutineTemplate = {
      id: `rt-custom-${Date.now()}`,
      name: newRoutineName.trim(),
      subtitle: newRoutineSubtitle.trim() || 'Custom Engineered Routine',
      category: newRoutineCategory,
      estimatedDurationMins: Number(newRoutineDuration),
      exercises: newRoutineExercises,
      notes: 'Custom user routine saved for rapid logging.',
    };

    saveRoutines([newTemplate, ...routines]);
    setShowCreateModal(false);
    setNewRoutineName('');
    setNewRoutineSubtitle('');
  };

  // -------------------------------------------------------------
  // ACTIVE SESSION RUNNER VIEW
  // -------------------------------------------------------------
  if (activeSessionExercises && selectedRoutine) {
    const currentEx = activeSessionExercises[currentExerciseIdx];
    const totalVolume = calculateTotalVolumeKg(activeSessionExercises);
    const completedSets = countCompletedSets(activeSessionExercises);
    const totalSetsAcrossRoutine = activeSessionExercises.reduce((sum, ex) => sum + ex.sets.length, 0);

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Active Routine Header */}
        <div className="rounded-3xl bg-slate-900/90 border border-emerald-500/30 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-game font-bold text-white text-base truncate">
                {selectedRoutine.name}
              </h3>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Cancel this active workout routine?')) {
                  setActiveSessionExercises(null);
                  setSelectedRoutine(null);
                  setActiveRestSeconds(null);
                }
              }}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Exit
            </button>
          </div>

          {/* Exercise Stepper Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {activeSessionExercises.map((ex, idx) => {
              const allDone = ex.sets.every((s) => s.completed);
              const isCurrent = idx === currentExerciseIdx;
              return (
                <button
                  key={ex.exerciseId}
                  onClick={() => setCurrentExerciseIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                    isCurrent
                      ? 'bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/20'
                      : allDone
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {allDone && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>#{idx + 1} {ex.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-center text-xs">
            <div className="bg-slate-950/60 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400">Sets Done</div>
              <div className="font-mono font-bold text-white">
                {completedSets} / {totalSetsAcrossRoutine}
              </div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400">Total Volume</div>
              <div className="font-mono font-bold text-amber-400">
                {totalVolume.toLocaleString()} kg
              </div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400">Target Muscle</div>
              <div className="font-mono font-bold text-cyan-400 truncate">
                {currentEx.targetMuscle}
              </div>
            </div>
          </div>
        </div>

        {/* Audible Rest Interval Timer (if active) */}
        {activeRestSeconds !== null && (
          <RestIntervalTimer
            totalSeconds={activeRestSeconds}
            title={activeRestTitle}
            onCancel={() => setActiveRestSeconds(null)}
            onFinish={() => setActiveRestSeconds(null)}
          />
        )}

        {/* Current Exercise Detail & Sets Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                Exercise {currentExerciseIdx + 1} of {activeSessionExercises.length}
              </div>
              <h4 className="font-game font-bold text-white text-base">
                {currentEx.name}
              </h4>
            </div>

            {/* Quick trigger rest button */}
            <button
              onClick={() => {
                setActiveRestTitle(`Rest interval for ${currentEx.name}`);
                setActiveRestSeconds(currentEx.restSeconds);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30 cursor-pointer min-h-[36px]"
            >
              Rest {currentEx.restSeconds}s
            </button>
          </div>

          {/* Sets Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-2 font-game">
              <span className="w-8">SET</span>
              <span className="flex-1 text-center">WEIGHT (KG)</span>
              <span className="w-16 text-center">REPS</span>
              <span className="w-12 text-right">DONE</span>
            </div>

            {currentEx.sets.map((set, sIdx) => (
              <div
                key={set.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                  set.completed
                    ? 'bg-emerald-950/40 border-emerald-500/50'
                    : 'bg-slate-950 border-white/5'
                }`}
              >
                <span className="w-8 font-mono font-bold text-emerald-400 text-center">
                  #{set.setNumber}
                </span>

                <div className="flex-1 flex justify-center">
                  <input
                    type="number"
                    value={set.weightKg}
                    onChange={(e) => handleUpdateSetWeight(sIdx, Number(e.target.value))}
                    aria-label={`Set ${set.setNumber} weight in kg`}
                    className="w-20 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="w-16 flex justify-center">
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => handleUpdateSetReps(sIdx, Number(e.target.value))}
                    aria-label={`Set ${set.setNumber} repetitions`}
                    className="w-14 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="w-12 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleSetComplete(sIdx)}
                    aria-label={`Mark set ${set.setNumber} as ${set.completed ? 'incomplete' : 'complete'}`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      set.completed
                        ? 'bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentExerciseIdx(Math.max(0, currentExerciseIdx - 1))}
              disabled={currentExerciseIdx === 0}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-white flex items-center gap-1 min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentExerciseIdx < activeSessionExercises.length - 1 ? (
              <button
                onClick={() => setCurrentExerciseIdx(currentExerciseIdx + 1)}
                className="py-2 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/30 min-h-[44px]"
              >
                Next Exercise <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishRoutine}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all min-h-[44px]"
              >
                Finish & Save Routine
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ROUTINE CATALOG & CAROUSEL VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Top Banner / Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-game font-bold text-white text-base">Workout Routine Templates</h3>
          <p className="text-xs text-slate-400">
            Multi-exercise protocols with automated rest countdown beeps
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" /> New Routine
        </button>
      </div>

      {/* Routine Cards List */}
      <div className="space-y-3">
        {routines.map((routine) => (
          <div
            key={routine.id}
            className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl space-y-3 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-game font-bold text-white text-sm">{routine.name}</h4>
                  <p className="text-xs text-slate-400">{routine.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-emerald-400 border border-white/10">
                  ~{routine.estimatedDurationMins}m
                </span>
                {routine.id.startsWith('rt-custom-') && (
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    aria-label={`Delete custom routine ${routine.name}`}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Exercises List Badges */}
            <div className="flex flex-wrap gap-1.5">
              {routine.exercises.map((ex) => (
                <span
                  key={ex.id}
                  className="px-2 py-1 rounded-lg bg-slate-950/70 border border-white/5 text-[10px] font-mono text-slate-300"
                >
                  {ex.name} ({ex.targetSets}×{ex.targetReps})
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleStartSession(routine)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-xs shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all min-h-[44px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Interactive Routine
              </button>
              <button
                onClick={() => handleQuickLogRoutine(routine)}
                title="Quick Log all sets without active tracking"
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold border border-white/10 transition-colors min-h-[44px]"
              >
                Quick Log
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Custom Routine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <form
            ref={createModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-routine-title"
            onSubmit={handleCreateRoutineSubmit}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 id="create-routine-title" className="font-game font-bold text-white text-base">
                Create Workout Routine
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Routine Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Spartan Shoulder & Core Blast"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Subtitle / Muscle Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g., Deltoid boulder training & obliques"
                  value={newRoutineSubtitle}
                  onChange={(e) => setNewRoutineSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={newRoutineCategory}
                    onChange={(e) => setNewRoutineCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="push">Push</option>
                    <option value="pull">Pull</option>
                    <option value="legs">Legs</option>
                    <option value="fullbody">Full Body</option>
                    <option value="calisthenics">Calisthenics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    value={newRoutineDuration}
                    onChange={(e) => setNewRoutineDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Exercises in routine */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    Exercises ({newRoutineExercises.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRoutineExercises([
                        ...newRoutineExercises,
                        {
                          id: `ex-${Date.now()}-${newRoutineExercises.length + 1}`,
                          name: 'Dumbbell Lateral Raises',
                          targetMuscle: 'Side Delts',
                          targetSets: 3,
                          targetReps: 12,
                          defaultWeightKg: 12,
                          restSeconds: 60,
                        },
                      ]);
                    }}
                    className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Exercise
                  </button>
                </div>

                {newRoutineExercises.map((ex, idx) => (
                  <div key={ex.id} className="p-3 bg-slate-950/70 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        #{idx + 1} Exercise
                      </span>
                      {newRoutineExercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setNewRoutineExercises(newRoutineExercises.filter((_, i) => i !== idx))
                          }
                          className="text-slate-500 hover:text-rose-400 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Exercise Name"
                      value={ex.name}
                      onChange={(e) => {
                        const next = [...newRoutineExercises];
                        next[idx].name = e.target.value;
                        setNewRoutineExercises(next);
                      }}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Sets</span>
                        <input
                          type="number"
                          value={ex.targetSets}
                          onChange={(e) => {
                            const next = [...newRoutineExercises];
                            next[idx].targetSets = Number(e.target.value);
                            setNewRoutineExercises(next);
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg py-1 text-center text-white"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Reps</span>
                        <input
                          type="number"
                          value={ex.targetReps}
                          onChange={(e) => {
                            const next = [...newRoutineExercises];
                            next[idx].targetReps = Number(e.target.value);
                            setNewRoutineExercises(next);
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg py-1 text-center text-white"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Kg</span>
                        <input
                          type="number"
                          value={ex.defaultWeightKg}
                          onChange={(e) => {
                            const next = [...newRoutineExercises];
                            next[idx].defaultWeightKg = Number(e.target.value);
                            setNewRoutineExercises(next);
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg py-1 text-center text-white"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Rest(s)</span>
                        <input
                          type="number"
                          value={ex.restSeconds}
                          onChange={(e) => {
                            const next = [...newRoutineExercises];
                            next[idx].restSeconds = Number(e.target.value);
                            setNewRoutineExercises(next);
                          }}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg py-1 text-center text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-bold text-sm shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all mt-2 min-h-[44px]"
            >
              Save Custom Routine Template
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
