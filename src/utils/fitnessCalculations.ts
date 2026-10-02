import { RankTier, UserStats } from '../types';

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  if (gender === 'female') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
  // Default to male / other formula
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
}

/**
 * Estimates active calories burned from steps
 * Average calculation: ~0.04 - 0.05 kcal per step based on body weight
 */
export function calculateStepCalories(steps: number, weightKg: number): number {
  const calPerStep = (weightKg / 70) * 0.042;
  return Math.round(steps * calPerStep);
}

/**
 * Calculates calories burned from workout using MET (Metabolic Equivalent of Task)
 * Formula: Calories = (MET * 3.5 * weightKg / 200) * durationInMinutes
 */
export function calculateWorkoutCalories(
  metValue: number,
  durationMinutes: number,
  weightKg: number,
  intensityModifier: 'light' | 'moderate' | 'vigorous' | 'extreme' = 'moderate'
): number {
  const intensityMultiplier = {
    light: 0.85,
    moderate: 1.0,
    vigorous: 1.2,
    extreme: 1.4,
  }[intensityModifier];

  const effectiveMET = metValue * intensityMultiplier;
  const burned = (effectiveMET * 3.5 * weightKg / 200) * durationMinutes;
  return Math.round(Math.max(burned, 5));
}

/**
 * Calculates pushup calories based on reps and weight
 * Approx: ~0.45 kcal per pushup for 75kg person
 */
export function calculatePushupCalories(reps: number, weightKg: number): number {
  const calPerRep = (weightKg / 75) * 0.45;
  return Math.round(reps * calPerRep);
}

/**
 * Calculates Net Caloric Intake
 * Net = Consumed - (BMR + Active Workout Burn + Step Burn)
 * A negative net means a caloric deficit (fat loss).
 * A positive net means caloric surplus (muscle building / weight gain).
 */
export function calculateNetCalories(
  caloriesConsumed: number,
  bmr: number,
  activeWorkoutCalories: number,
  stepCalories: number
): {
  consumed: number;
  totalBurn: number;
  activeBurn: number;
  net: number;
  status: 'deficit' | 'maintenance' | 'surplus';
  description: string;
} {
  const activeBurn = activeWorkoutCalories + stepCalories;
  const totalBurn = bmr + activeBurn;
  const net = caloriesConsumed - totalBurn;

  let status: 'deficit' | 'maintenance' | 'surplus' = 'maintenance';
  let description = 'Equilibrium: Maintaining body weight.';

  if (net < -250) {
    status = 'deficit';
    description = `Caloric Deficit (${Math.abs(net)} kcal): Active fat burning zone!`;
  } else if (net > 250) {
    status = 'surplus';
    description = `Caloric Surplus (+${net} kcal): Muscle hypertrophy / growth fuel.`;
  }

  return {
    consumed: caloriesConsumed,
    totalBurn,
    activeBurn,
    net,
    status,
    description,
  };
}

/**
 * Calculates XP required to reach the next level
 * Progressive RPG curve: Level 1 -> 250, Level 2 -> 450, Level 10 -> 2,500, etc.
 */
export function getXpForLevel(level: number): number {
  return Math.floor(250 * Math.pow(level, 1.25));
}

/**
 * Maps player level to Rank Tier (Starts Beginner Level 1-5 then Master)
 */
export function getRankTier(level: number): RankTier {
  if (level >= 15) return 'Apex Master';
  if (level >= 10) return 'Grandmaster';
  if (level >= 6) return 'Master';
  return 'Beginner';
}

/**
 * Titles unlocked at various player levels (Beginner 1-5 then Master)
 */
export function getPlayerTitle(level: number): string {
  if (level >= 20) return 'Supreme Apex Master';
  if (level >= 15) return 'Apex Master of the Realm';
  if (level >= 12) return 'Grandmaster II';
  if (level >= 10) return 'Grandmaster I';
  if (level === 9) return 'Master IV (Iron Core)';
  if (level === 8) return 'Master III (Shadow Striker)';
  if (level === 7) return 'Master II (Endurance Titan)';
  if (level === 6) return 'Master I (Apex Ascendant)';
  if (level === 5) return 'Beginner V (Master Contender)';
  if (level === 4) return 'Beginner IV (Iron Vanguard)';
  if (level === 3) return 'Beginner III (Disciplined Scout)';
  if (level === 2) return 'Beginner II (Quest Seeker)';
  return 'Beginner I (Fitness Novice)';
}

/**
 * Calculates motivating streak multiplier for consecutive days hitting both calorie & activity targets
 */
export function getStreakMultiplier(consecutiveDays: number): {
  multiplier: number;
  bonusPercent: number;
  badge: string;
} {
  if (consecutiveDays >= 7) {
    return { multiplier: 2.0, bonusPercent: 100, badge: '🔥 Master Ascendant (2.0x XP)' };
  }
  if (consecutiveDays >= 5) {
    return { multiplier: 1.6, bonusPercent: 60, badge: '⚡ Master Contender (1.6x XP)' };
  }
  if (consecutiveDays >= 3) {
    return { multiplier: 1.3, bonusPercent: 30, badge: '⚔️ Momentum Surge (1.3x XP)' };
  }
  if (consecutiveDays >= 1) {
    return { multiplier: 1.1, bonusPercent: 10, badge: '🌱 Spark of Discipline (1.1x XP)' };
  }
  return { multiplier: 1.0, bonusPercent: 0, badge: 'Beginner Quest' };
}

/**
 * Format minutes into "1h 25m" or "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Calculates total cumulative XP across all achieved levels plus current level progress
 */
export function calculateCumulativeXp(level: number, currentXp: number): number {
  let total = currentXp;
  for (let lvl = 1; lvl < level; lvl++) {
    total += getXpForLevel(lvl);
  }
  return total;
}

