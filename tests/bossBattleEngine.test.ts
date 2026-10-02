import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBossMaxHp,
  calculateActivityDamage,
  executeApexStrikeDamage,
  generateBossLoot,
} from '../src/utils/bossBattleEngine';
import { BossDefinition, UserStats, WorkoutLogEntry } from '../src/types';

const mockUser: UserStats = {
  name: 'Test Warrior',
  avatar: '',
  level: 5,
  xp: 1200,
  xpToNextLevel: 2500,
  title: 'Novice Striker',
  rankTier: 'Beginner',
  currentStreak: 7,
  longestStreak: 10,
  consecutiveTargetsStreak: 4,
  streakShields: 1,
  gems: 45,
  weightKg: 75,
  heightCm: 178,
  age: 26,
  gender: 'male',
  activityLevel: 'moderate',
  dailyGoalSteps: 10000,
  dailyGoalCaloriesBurn: 500,
  dailyGoalActiveMinutes: 45,
  dailyGoalWaterMl: 3000,
  dailyCalorieBudget: 2200,
  rpgAttributes: {
    strength: 10,
    stamina: 8,
    agility: 12,
    discipline: 15,
  },
};

const mockBoss: BossDefinition = {
  id: 'boss-ironclad-goliath',
  name: 'Ironclad Goliath',
  subtitle: 'The Unbroken Bastion',
  element: 'earth',
  avatarUrl: '',
  description: '',
  weakness: 'gym',
  dayOfWeek: 1,
  baseMultiplier: 1.0,
  themeColor: '',
};

describe('Boss Battle Engine Tests', () => {
  describe('calculateBossMaxHp', () => {
    test('scales HP based on daily calorie burn goal, steps goal, and player level', () => {
      // Formula: round((200 + 500*1.5 + 10000*0.15) * (1 + 5*0.04))
      // = round((200 + 750 + 1500) * 1.2) = round(2450 * 1.2) = 2940
      const hp = calculateBossMaxHp(mockUser);
      assert.equal(hp, 2940);
    });

    test('enforces minimum floor of 500 HP for low level or zero goals', () => {
      const minimalUser = {
        ...mockUser,
        level: 1,
        dailyGoalCaloriesBurn: 0,
        dailyGoalSteps: 0,
      };
      const hp = calculateBossMaxHp(minimalUser);
      assert.ok(hp >= 500);
    });
  });

  describe('calculateActivityDamage', () => {
    test('calculates pushup damage scaled by user strength', () => {
      const pushupActivity = {
        category: 'pushups' as const,
        reps: 50,
      };
      // Base: 50 * 3.0 = 150. Strength multiplier: 1 + 10*0.02 = 1.2. Total = 180
      const result = calculateActivityDamage(pushupActivity, mockBoss, mockUser, { disableCrit: true });
      assert.equal(result.damage, 180);
      assert.equal(result.weaknessBonus, false);
      assert.equal(result.isCrit, false);
    });

    test('applies 50% weakness multiplier when activity matches boss weakness', () => {
      const gymWorkout: Partial<WorkoutLogEntry> = {
        category: 'gym',
        gymExercises: [
          {
            id: 'ex1',
            exerciseName: 'Bench Press',
            targetMuscle: 'Chest',
            sets: [
              { id: 's1', setNumber: 1, weightKg: 80, reps: 10, completed: true },
              { id: 's2', setNumber: 2, weightKg: 80, reps: 10, completed: true },
            ],
          },
        ],
      };
      // Total weight: 1600kg. Sets completed: 2.
      // Base: 1600 * 0.05 + 2 * 20 = 80 + 40 = 120.
      // Strength: 1 + 10*0.02 = 1.2 -> 144.
      // Weakness match (gym == gym): 144 * 1.5 = 216.
      const result = calculateActivityDamage(gymWorkout, mockBoss, mockUser, { disableCrit: true });
      assert.equal(result.damage, 216);
      assert.equal(result.weaknessBonus, true);
    });

    test('calculates step damage scaled by stamina', () => {
      const stepInput = {
        category: 'cardio' as const,
        steps: 5000,
      };
      // Base: 5000 * 0.08 = 400. Stamina: 1 + 8*0.02 = 1.16. Total = 464
      const result = calculateActivityDamage(stepInput, mockBoss, mockUser, { disableCrit: true });
      assert.equal(result.damage, 464);
    });

    test('calculates HIIT damage scaled by agility', () => {
      const hiitWorkout: Partial<WorkoutLogEntry> = {
        category: 'hiit',
        caloriesBurned: 300,
      };
      // Base: 300 * 0.9 = 270. Agility: 1 + 12*0.02 = 1.24. Total = round(270 * 1.24) = 335
      const result = calculateActivityDamage(hiitWorkout, mockBoss, mockUser, { disableCrit: true });
      assert.equal(result.damage, 335);
    });

    test('applies 1.5x multiplier when critical hit is triggered', () => {
      const pushupActivity = {
        category: 'pushups' as const,
        reps: 50,
      };
      // Base: 180. Crit: 180 * 1.5 = 270.
      const result = calculateActivityDamage(pushupActivity, mockBoss, mockUser, { forceCrit: true });
      assert.equal(result.damage, 270);
      assert.equal(result.isCrit, true);
    });
  });

  describe('executeApexStrikeDamage', () => {
    test('calculates active apex strike with level scaling', () => {
      const strikeNormal = executeApexStrikeDamage(mockBoss, mockUser, { disableCrit: true });
      // Base damage: round(150 * (1 + 5*0.05)) = 188
      assert.equal(strikeNormal.damage, 188);
      assert.equal(strikeNormal.isCrit, false);

      const strikeCrit = executeApexStrikeDamage(mockBoss, mockUser, { forceCrit: true });
      // Crit damage: round(188 * 2.0) = 376
      assert.equal(strikeCrit.damage, 376);
      assert.equal(strikeCrit.isCrit, true);
    });
  });

  describe('generateBossLoot', () => {
    test('drops balanced gems, xp, streak shield, and stat points', () => {
      const loot = generateBossLoot(mockBoss, mockUser);
      assert.ok(loot.gems >= 15 && loot.gems <= 30);
      assert.ok(loot.xp >= 400 && loot.xp <= 750);
      assert.equal(loot.streakShields, 1);
      assert.ok(loot.unlockedTitle.length > 0);
      assert.ok(
        (loot.statPoints.strength ?? 0) > 0 ||
        (loot.statPoints.stamina ?? 0) > 0 ||
        (loot.statPoints.agility ?? 0) > 0 ||
        (loot.statPoints.discipline ?? 0) > 0
      );
    });
  });
});
