import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalVolumeKg,
  countCompletedSets,
  estimateRoutineCalories,
  calculateRoutineXp,
  RoutineExerciseRecord,
} from '../src/utils/routineCalculations';

describe('Workout Routine Calculations Suite', () => {
  const sampleExercises: RoutineExerciseRecord[] = [
    {
      name: 'Barbell Bench Press',
      targetMuscle: 'Chest',
      sets: [
        { weightKg: 80, reps: 10, completed: true },
        { weightKg: 85, reps: 8, completed: true },
        { weightKg: 90, reps: 6, completed: false }, // not completed
      ],
    },
    {
      name: 'Incline Dumbbell Press',
      targetMuscle: 'Upper Chest',
      sets: [
        { weightKg: 30, reps: 12, completed: true },
        { weightKg: 30, reps: 10, completed: true },
      ],
    },
  ];

  describe('calculateTotalVolumeKg', () => {
    test('computes cumulative volume for completed sets only', () => {
      // Bench: (80*10 = 800) + (85*8 = 680) = 1480 (skip uncompleted set 3)
      // Incline: (30*12 = 360) + (30*10 = 300) = 660
      // Total = 1480 + 660 = 2140 kg
      const volume = calculateTotalVolumeKg(sampleExercises);
      assert.equal(volume, 2140);
    });

    test('returns 0 if exercises array is empty or no sets are completed', () => {
      assert.equal(calculateTotalVolumeKg([]), 0);
      assert.equal(
        calculateTotalVolumeKg([
          {
            name: 'Squats',
            sets: [{ weightKg: 100, reps: 5, completed: false }],
          },
        ]),
        0
      );
    });
  });

  describe('countCompletedSets', () => {
    test('counts total completed sets accurately', () => {
      const count = countCompletedSets(sampleExercises);
      assert.equal(count, 4); // 2 from bench, 2 from incline
    });

    test('returns 0 for empty exercises list', () => {
      assert.equal(countCompletedSets([]), 0);
    });
  });

  describe('estimateRoutineCalories', () => {
    test('estimates reasonable caloric burn for 45 min workout at 75kg bodyweight', () => {
      const burn = estimateRoutineCalories(45, 75, 'vigorous');
      assert.ok(burn > 300 && burn < 600, `Expected burn between 300 and 600, got ${burn}`);
    });

    test('scales correctly with intensity level', () => {
      const light = estimateRoutineCalories(40, 70, 'light');
      const extreme = estimateRoutineCalories(40, 70, 'extreme');
      assert.ok(extreme > light, 'Extreme intensity should burn more than light');
    });
  });

  describe('calculateRoutineXp', () => {
    test('calculates structured XP bonus with volume and duration', () => {
      const xp = calculateRoutineXp(45, 12, 3500);
      // duration: 45*4 = 180
      // sets: 12*12 = 144
      // volumeBonus: min(250, round(3500 * 0.05)) = min(250, 175) = 175
      // total = 180 + 144 + 175 = 499
      assert.equal(xp, 499);
    });

    test('enforces minimum XP floor of 50', () => {
      const xp = calculateRoutineXp(0, 0, 0);
      assert.equal(xp, 50);
    });
  });
});
