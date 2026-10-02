import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBMR,
  calculateStepCalories,
  calculateWorkoutCalories,
  calculatePushupCalories,
  calculateNetCalories,
  getXpForLevel,
  getRankTier,
  getPlayerTitle,
  getStreakMultiplier,
  formatDuration,
  calculateCumulativeXp,
} from '../src/utils/fitnessCalculations';

describe('Fitness Calculations Suite', () => {
  describe('calculateBMR', () => {
    it('calculates male BMR correctly using Mifflin-St Jeor formula', () => {
      // Male: 10 * 70 + 6.25 * 175 - 5 * 25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
      const bmr = calculateBMR(70, 175, 25, 'male');
      assert.equal(bmr, 1674);
    });

    it('calculates female BMR correctly using Mifflin-St Jeor formula', () => {
      // Female: 10 * 60 + 6.25 * 165 - 5 * 28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
      const bmr = calculateBMR(60, 165, 28, 'female');
      assert.equal(bmr, 1330);
    });

    it('defaults to male formula for other gender option', () => {
      const bmrOther = calculateBMR(70, 175, 25, 'other');
      const bmrMale = calculateBMR(70, 175, 25, 'male');
      assert.equal(bmrOther, bmrMale);
    });
  });

  describe('calculateStepCalories', () => {
    it('calculates step burn proportional to body weight', () => {
      // 10000 steps, 70kg -> (70 / 70) * 0.042 * 10000 = 420
      assert.equal(calculateStepCalories(10000, 70), 420);
      // 10000 steps, 85kg -> (85 / 70) * 0.042 * 10000 = 510
      assert.equal(calculateStepCalories(10000, 85), 510);
    });

    it('returns 0 for zero steps', () => {
      assert.equal(calculateStepCalories(0, 70), 0);
    });
  });

  describe('calculateWorkoutCalories', () => {
    it('calculates calories burned with MET value and duration', () => {
      // MET 6.0, 30 min, 70 kg, moderate (1.0x multiplier)
      // Calories = (6.0 * 3.5 * 70 / 200) * 30 = 7.35 * 30 = 220.5 -> 221
      assert.equal(calculateWorkoutCalories(6.0, 30, 70, 'moderate'), 221);
    });

    it('applies intensity multipliers accurately', () => {
      const light = calculateWorkoutCalories(8.0, 30, 70, 'light'); // 0.85
      const moderate = calculateWorkoutCalories(8.0, 30, 70, 'moderate'); // 1.0
      const vigorous = calculateWorkoutCalories(8.0, 30, 70, 'vigorous'); // 1.2
      const extreme = calculateWorkoutCalories(8.0, 30, 70, 'extreme'); // 1.4

      assert.ok(light < moderate);
      assert.ok(moderate < vigorous);
      assert.ok(vigorous < extreme);
    });

    it('enforces a minimum of 5 calories', () => {
      assert.equal(calculateWorkoutCalories(0.1, 1, 50, 'light'), 5);
    });
  });

  describe('calculatePushupCalories', () => {
    it('calculates pushup caloric expenditure', () => {
      // 50 reps, 75kg: (75 / 75) * 0.45 * 50 = 22.5 -> 23
      assert.equal(calculatePushupCalories(50, 75), 23);
      // 100 reps, 75kg: 45
      assert.equal(calculatePushupCalories(100, 75), 45);
    });
  });

  describe('calculateNetCalories', () => {
    it('identifies caloric deficit correctly', () => {
      // Consumed: 1500, BMR: 1600, Workout: 400, Steps: 200 -> total burn = 2200, net = -700
      const res = calculateNetCalories(1500, 1600, 400, 200);
      assert.equal(res.net, -700);
      assert.equal(res.status, 'deficit');
      assert.ok(res.description.includes('Caloric Deficit'));
    });

    it('identifies caloric surplus correctly', () => {
      // Consumed: 3000, BMR: 1600, Workout: 400, Steps: 200 -> total burn = 2200, net = +800
      const res = calculateNetCalories(3000, 1600, 400, 200);
      assert.equal(res.net, 800);
      assert.equal(res.status, 'surplus');
      assert.ok(res.description.includes('Caloric Surplus'));
    });

    it('identifies maintenance when within +/- 250 kcal', () => {
      // Consumed: 2100, BMR: 1600, Workout: 300, Steps: 200 -> total burn = 2100, net = 0
      const res = calculateNetCalories(2100, 1600, 300, 200);
      assert.equal(res.net, 0);
      assert.equal(res.status, 'maintenance');
      assert.ok(res.description.includes('Equilibrium'));
    });
  });

  describe('RPG XP and Progression System', () => {
    it('calculates progressive XP threshold for levels', () => {
      assert.equal(getXpForLevel(1), 250);
      assert.equal(getXpForLevel(2), 594);
      assert.equal(getXpForLevel(5), 1869);
      assert.equal(getXpForLevel(10), 4445);
    });

    it('calculates cumulative XP accurately across levels', () => {
      // Level 1, 100 XP -> 100
      assert.equal(calculateCumulativeXp(1, 100), 100);
      // Level 2, 50 XP -> getXpForLevel(1) + 50 = 250 + 50 = 300
      assert.equal(calculateCumulativeXp(2, 50), 300);
      // Level 3, 0 XP -> getXpForLevel(1) + getXpForLevel(2) = 250 + 594 = 844
      assert.equal(calculateCumulativeXp(3, 0), 844);
    });

    it('maps level tiers according to progression specs', () => {
      assert.equal(getRankTier(1), 'Beginner');
      assert.equal(getRankTier(5), 'Beginner');
      assert.equal(getRankTier(6), 'Master');
      assert.equal(getRankTier(9), 'Master');
      assert.equal(getRankTier(10), 'Grandmaster');
      assert.equal(getRankTier(14), 'Grandmaster');
      assert.equal(getRankTier(15), 'Apex Master');
    });

    it('assigns descriptive player titles based on level', () => {
      assert.equal(getPlayerTitle(1), 'Beginner I (Fitness Novice)');
      assert.equal(getPlayerTitle(5), 'Beginner V (Master Contender)');
      assert.equal(getPlayerTitle(6), 'Master I (Apex Ascendant)');
      assert.equal(getPlayerTitle(10), 'Grandmaster I');
      assert.equal(getPlayerTitle(20), 'Supreme Apex Master');
    });

    it('calculates streak multipliers and bonus percent', () => {
      assert.equal(getStreakMultiplier(0).multiplier, 1.0);
      assert.equal(getStreakMultiplier(1).multiplier, 1.1);
      assert.equal(getStreakMultiplier(3).multiplier, 1.3);
      assert.equal(getStreakMultiplier(5).multiplier, 1.6);
      assert.equal(getStreakMultiplier(7).multiplier, 2.0);
    });
  });

  describe('formatDuration', () => {
    it('formats minutes into readable strings', () => {
      assert.equal(formatDuration(45), '45m');
      assert.equal(formatDuration(60), '1h');
      assert.equal(formatDuration(90), '1h 30m');
      assert.equal(formatDuration(125), '2h 5m');
    });
  });
});
