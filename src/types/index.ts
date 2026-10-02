export type RankTier = 'Beginner' | 'Master' | 'Grandmaster' | 'Apex Master';

export interface UserStats {
  id?: string;
  name: string;
  avatar: string;
  email?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp?: number;
  title: string;
  rankTier: RankTier;
  currentStreak: number;
  longestStreak: number;
  consecutiveTargetsStreak: number; // Consecutive days hitting BOTH calorie & activity goals
  streakShields: number; // consumable items to protect streak
  gems: number; // in-game reward currency
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  dailyGoalSteps: number;
  dailyGoalCaloriesBurn: number;
  dailyGoalActiveMinutes: number;
  dailyGoalWaterMl: number;
  dailyCalorieBudget: number; // targeted net or intake
  rpgAttributes: {
    strength: number; // leveled by gym & pushups
    stamina: number; // leveled by cardio & steps
    agility: number; // leveled by hiit & speed
    discipline: number; // leveled by streaks & meal logging
  };
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isIndianCuisine?: boolean;
}

export interface MealEntry {
  id: string;
  name: string;
  mealType: MealType;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  time: string;
  date: string; // YYYY-MM-DD
  photoUrl?: string;
  isIndianCuisine?: boolean;
  servingDescription?: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  category: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isIndianCuisine?: boolean;
  servingDescription?: string;
  photoUrl?: string;
}

export type ActivityCategory = 'pushups' | 'gym' | 'cardio' | 'hiit' | 'flexibility' | 'custom';

export interface GymSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface GymExerciseLog {
  id: string;
  exerciseName: string;
  targetMuscle: string;
  sets: GymSet[];
}

export interface WorkoutLogEntry {
  id: string;
  activityId: string;
  activityName: string;
  icon: string;
  category: ActivityCategory;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: 'light' | 'moderate' | 'vigorous' | 'extreme';
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  pushupReps?: number;
  gymExercises?: GymExerciseLog[];
  xpGained: number;
  notes?: string;
  heartRateAvg?: number;
}

export interface ActivityTypeDefinition {
  id: string;
  name: string;
  icon: string; // Lucide icon key
  category: ActivityCategory;
  metValue: number; // Metabolic Equivalent of Task
  isCustom: boolean;
  defaultDurationMinutes: number;
  caloriesPerMinuteApprox: number;
  description?: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  steps: number;
  activeMinutes: number;
  caloriesBurned: number; // Total active workout + step burn
  waterMl: number;
  meals: MealEntry[];
  workouts: WorkoutLogEntry[];
  goalMet: boolean;
  streakFrozen?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'pushups' | 'gym' | 'calories' | 'milestone' | 'social';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  gemReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: 'steps' | 'workout' | 'pushups' | 'nutrition' | 'water';
  target: number;
  current: number;
  unit: string;
  xpReward: number;
  gemReward: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface LeaderboardUser {
  id: string;
  rank: number;
  username: string;
  avatar: string;
  level: number;
  title: string;
  weeklyXp: number;
  totalXp: number;
  streak: number;
  caloriesBurned: number;
  isUser: boolean;
  isFriend: boolean;
  league: RankTier;
  highFivesReceived: number;
  hasHighFivedToday?: boolean;
  badge: string;
}

export interface NotificationReminder {
  id: string;
  title: string;
  message: string;
  time: string; // "HH:MM"
  enabled: boolean;
  category: 'streak' | 'workout' | 'meal' | 'hydration' | 'pushup';
  daysOfWeek: number[]; // 0-6
}

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  costGems: number;
  category: 'boost' | 'title' | 'cosmetic' | 'shield';
  purchased?: boolean;
  badge?: string;
}

export type BossElement = 'earth' | 'fire' | 'wind' | 'ice' | 'void' | 'lightning' | 'poison' | 'shadow';

export interface BossDefinition {
  id: string;
  name: string;
  subtitle: string;
  element: BossElement;
  avatarUrl: string;
  description: string;
  weakness: ActivityCategory;
  resistance?: BossElement;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  baseMultiplier: number;
  themeColor: string; // Tailwind/hex glow color token
}

export interface DailyBossDamageLogEntry {
  id: string;
  source: string;
  damage: number;
  isCrit: boolean;
  isWeakness: boolean;
  timestamp: string;
}

export interface DailyBossState {
  date: string; // YYYY-MM-DD
  bossId: string;
  maxHp: number;
  currentHp: number;
  apexChargePercent: number; // 0 - 100
  isDefeated: boolean;
  chestClaimed: boolean;
  damageLog: DailyBossDamageLogEntry[];
}

export interface BossLootDrop {
  gems: number;
  xp: number;
  streakShields: number;
  statPoints: {
    strength?: number;
    stamina?: number;
    agility?: number;
    discipline?: number;
  };
  unlockedTitle?: string;
}

export interface WorkoutRoutineExercise {
  id: string;
  name: string;
  targetMuscle: string;
  targetSets: number;
  targetReps: number;
  defaultWeightKg: number;
  restSeconds: number;
}

export interface WorkoutRoutineTemplate {
  id: string;
  name: string;
  subtitle: string;
  category: 'push' | 'pull' | 'legs' | 'fullbody' | 'calisthenics' | 'custom';
  estimatedDurationMins: number;
  exercises: WorkoutRoutineExercise[];
  notes?: string;
}


