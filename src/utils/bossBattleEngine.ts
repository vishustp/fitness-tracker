import {
  ActivityCategory,
  BossDefinition,
  BossLootDrop,
  UserStats,
  WorkoutLogEntry,
} from '../types';

/**
 * Calculates adaptive Boss Max HP based on daily calorie burn goal, steps goal, and player level
 */
export function calculateBossMaxHp(user: UserStats): number {
  const calorieBurnGoal = user.dailyGoalCaloriesBurn > 0 ? user.dailyGoalCaloriesBurn : 400;
  const stepsGoal = user.dailyGoalSteps > 0 ? user.dailyGoalSteps : 8000;
  const level = user.level > 0 ? user.level : 1;

  const basePool = 200 + calorieBurnGoal * 1.5 + stepsGoal * 0.15;
  const levelMultiplier = 1 + level * 0.04;

  const scaledHp = Math.round(basePool * levelMultiplier);
  return Math.max(500, scaledHp);
}

export interface ActivityDamageInput {
  category?: ActivityCategory;
  reps?: number;
  pushupReps?: number;
  steps?: number;
  durationMinutes?: number;
  caloriesBurned?: number;
  gymExercises?: WorkoutLogEntry['gymExercises'];
}

export interface ActivityDamageOptions {
  forceCrit?: boolean;
  disableCrit?: boolean;
}

/**
 * Calculates damage dealt to the daily boss by a fitness activity
 */
export function calculateActivityDamage(
  activity: ActivityDamageInput,
  boss: BossDefinition,
  user: UserStats,
  options?: ActivityDamageOptions
): { damage: number; isCrit: boolean; weaknessBonus: boolean } {
  const strength = user.rpgAttributes?.strength ?? 10;
  const stamina = user.rpgAttributes?.stamina ?? 10;
  const agility = user.rpgAttributes?.agility ?? 10;
  const discipline = user.rpgAttributes?.discipline ?? 10;

  let baseDamage = 0;
  const category = activity.category || 'custom';

  switch (category) {
    case 'pushups': {
      const reps = activity.pushupReps ?? activity.reps ?? 20;
      baseDamage = reps * 3.0 * (1 + strength * 0.02);
      break;
    }

    case 'gym': {
      let totalWeightMoved = 0;
      let completedSets = 0;

      if (activity.gymExercises && activity.gymExercises.length > 0) {
        for (const ex of activity.gymExercises) {
          for (const s of ex.sets) {
            if (s.completed) {
              totalWeightMoved += s.weightKg * s.reps;
              completedSets += 1;
            }
          }
        }
      }

      if (totalWeightMoved === 0 && completedSets === 0) {
        // Fallback for estimated gym workout
        const duration = activity.durationMinutes || 45;
        const cals = activity.caloriesBurned || 250;
        baseDamage = (duration * 2 + cals * 0.25) * (1 + strength * 0.02);
      } else {
        baseDamage = (totalWeightMoved * 0.05 + completedSets * 20) * (1 + strength * 0.02);
      }
      break;
    }

    case 'cardio': {
      if (activity.steps && activity.steps > 0) {
        baseDamage = activity.steps * 0.08 * (1 + stamina * 0.02);
      } else {
        const duration = activity.durationMinutes || 30;
        const cals = activity.caloriesBurned || 200;
        baseDamage = (duration * 8 + cals * 0.5) * (1 + stamina * 0.02);
      }
      break;
    }

    case 'hiit': {
      const cals = activity.caloriesBurned || (activity.durationMinutes ? activity.durationMinutes * 10 : 200);
      baseDamage = cals * 0.9 * (1 + agility * 0.02);
      break;
    }

    case 'flexibility': {
      const duration = activity.durationMinutes || 20;
      baseDamage = duration * 6 * (1 + agility * 0.02);
      break;
    }

    default: {
      const cals = activity.caloriesBurned || 150;
      baseDamage = cals * 0.6 * (1 + (strength + stamina) * 0.01);
      break;
    }
  }

  // Check elemental weakness (+50% bonus)
  const isWeakness = boss.weakness === category;
  if (isWeakness) {
    baseDamage *= 1.5;
  }

  // Critical hit calculation (based on discipline and streak)
  const streak = user.currentStreak || 0;
  const critChance = Math.min(0.5, 0.08 + discipline * 0.01 + streak * 0.005);
  let isCrit = false;
  if (options?.disableCrit) {
    isCrit = false;
  } else if (options?.forceCrit) {
    isCrit = true;
  } else {
    isCrit = Math.random() < critChance;
  }

  let finalDamage = Math.round(isCrit ? baseDamage * 1.5 : baseDamage);
  finalDamage = Math.max(5, finalDamage);

  return {
    damage: finalDamage,
    isCrit,
    weaknessBonus: isWeakness,
  };
}

/**
 * Calculates burst damage for active "Engage Apex Strike" button
 */
export function executeApexStrikeDamage(
  boss: BossDefinition,
  user: UserStats,
  options?: ActivityDamageOptions
): { damage: number; isCrit: boolean } {
  const level = user.level || 1;
  const discipline = user.rpgAttributes?.discipline || 10;
  const streak = user.currentStreak || 0;

  const baseDamage = Math.round(150 * (1 + level * 0.05));

  // Critical chance: 15% base + discipline*1.5% + streak*1% (capped at 75%)
  const critProbability = Math.min(0.75, 0.15 + discipline * 0.015 + streak * 0.01);
  let isCrit = false;
  if (options?.disableCrit) {
    isCrit = false;
  } else if (options?.forceCrit) {
    isCrit = true;
  } else {
    isCrit = Math.random() < critProbability;
  }

  const finalDamage = isCrit ? Math.round(baseDamage * 2.0) : baseDamage;

  return {
    damage: finalDamage,
    isCrit,
  };
}

/**
 * Generates balanced multi-tier loot when a boss is defeated
 */
export function generateBossLoot(boss: BossDefinition, user: UserStats): BossLootDrop {
  const level = user.level || 1;

  // Gems: 15 - 25 based on boss multiplier
  const gems = Math.round(15 * boss.baseMultiplier + Math.floor(Math.random() * 6));

  // XP: 400 - 750 based on level & boss multiplier
  const xp = Math.round((450 + level * 25) * boss.baseMultiplier);

  // 1 Streak Shield consumable
  const streakShields = 1;

  // Stat point allocation
  const statOptions: Array<'strength' | 'stamina' | 'agility' | 'discipline'> = [
    'strength',
    'stamina',
    'agility',
    'discipline',
  ];
  const primaryStat = statOptions[Math.floor(Math.random() * statOptions.length)];
  const secondaryStat = statOptions[Math.floor(Math.random() * statOptions.length)];

  const statPoints: BossLootDrop['statPoints'] = {
    [primaryStat]: 1,
  };
  if (primaryStat !== secondaryStat) {
    statPoints[secondaryStat] = 1;
  }

  // Exclusive slayer titles based on boss
  const titleMap: Record<string, string> = {
    'boss-ironclad-goliath': 'Titan Sunderer',
    'boss-zephyr-drake': 'Skyrunner Slayer',
    'boss-obsidian-colossus': 'Void Core Breaker',
    'boss-ignis-behemoth': 'Pyre Extinguisher',
    'boss-venomfang-wyrm': 'Serpent Subduer',
    'boss-frost-dreadnought': 'Glacier Sovereign',
    'boss-shadow-overlord': 'Apex Legend Slayer',
  };

  const unlockedTitle = titleMap[boss.id] || 'Behemoth Conqueror';

  return {
    gems,
    xp,
    streakShields,
    statPoints,
    unlockedTitle,
  };
}
