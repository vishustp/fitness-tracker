import { calculateWorkoutCalories } from './fitnessCalculations';

export interface ExerciseSetRecord {
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface RoutineExerciseRecord {
  name: string;
  targetMuscle?: string;
  sets: ExerciseSetRecord[];
}

/**
 * Calculates the total cumulative volume lifted (kg * reps) for completed sets.
 */
export function calculateTotalVolumeKg(exercises: RoutineExerciseRecord[]): number {
  return exercises.reduce((exerciseTotal, ex) => {
    const exVol = ex.sets.reduce((setTotal, s) => {
      if (s.completed && s.weightKg > 0 && s.reps > 0) {
        return setTotal + s.weightKg * s.reps;
      }
      return setTotal;
    }, 0);
    return exerciseTotal + exVol;
  }, 0);
}

/**
 * Counts total completed sets across all exercises in a routine session.
 */
export function countCompletedSets(exercises: RoutineExerciseRecord[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets.filter((s) => s.completed).length;
  }, 0);
}

/**
 * Estimates caloric expenditure for a structured workout routine based on MET and intensity.
 */
export function estimateRoutineCalories(
  durationMinutes: number,
  userWeightKg: number,
  intensity: 'light' | 'moderate' | 'vigorous' | 'extreme' = 'vigorous'
): number {
  const baseMet = 6.8;
  return calculateWorkoutCalories(baseMet, durationMinutes, userWeightKg, intensity);
}

/**
 * Awards structured RPG XP based on volume lifted, sets completed, and duration.
 */
export function calculateRoutineXp(
  durationMinutes: number,
  completedSets: number,
  volumeKg: number
): number {
  const durationXp = durationMinutes * 4;
  const setXp = completedSets * 12;
  const volumeBonusXp = Math.min(250, Math.round(volumeKg * 0.05));
  return Math.max(50, durationXp + setXp + volumeBonusXp);
}
