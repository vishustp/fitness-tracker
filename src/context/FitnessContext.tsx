import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, getDoc, deleteDoc } from 'firebase/firestore';
import {
  Achievement,
  ActivityTypeDefinition,
  BossDefinition,
  BossLootDrop,
  DailyActivity,
  DailyBossDamageLogEntry,
  DailyBossState,
  DailyQuest,
  GymSet,
  LeaderboardUser,
  MealEntry,
  NotificationReminder,
  ShopItem,
  UserStats,
  WorkoutLogEntry,
} from '../types';
import { getBossForDate } from '../data/bossData';
import {
  calculateBossMaxHp,
  calculateActivityDamage,
  executeApexStrikeDamage,
  generateBossLoot,
  ActivityDamageInput,
} from '../utils/bossBattleEngine';
import {
  defaultActivityTypes,
  generatePast30DaysHistory,
  initialAchievements,
  initialDailyQuests,
  initialLeaderboard,
  initialReminders,
  initialShopItems,
  initialUser,
} from '../data/initialData';
import {
  calculateBMR,
  calculateNetCalories,
  calculatePushupCalories,
  calculateStepCalories,
  calculateWorkoutCalories,
  getPlayerTitle,
  getRankTier,
  getXpForLevel,
  calculateCumulativeXp,
} from '../utils/fitnessCalculations';
import { sounds } from '../utils/soundEffects';
import { notificationService } from '../utils/notificationService';
import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  loginWithEmail,
  registerWithEmail,
  loginAnonymously,
  sendPasswordReset,
  handleFirestoreError,
  OperationType,
  validateFirestoreConnection,
} from '../firebase';

interface FitnessContextType {
  user: UserStats;
  currentUser: FirebaseUser | null;
  authLoading: boolean;
  loginAction: () => Promise<void>;
  logoutAction: () => Promise<void>;
  loginWithEmailAction: (email: string, pass: string) => Promise<void>;
  registerWithEmailAction: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginGuestAction: () => Promise<void>;
  resetPasswordAction: (email: string) => Promise<void>;
  syncCloudData: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  activeAuthModal: boolean;
  setActiveAuthModal: (open: boolean) => void;
  todayDate: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayActivity: DailyActivity;
  selectedDayActivity: DailyActivity;
  history: DailyActivity[];
  activityTypes: ActivityTypeDefinition[];
  achievements: Achievement[];
  dailyQuests: DailyQuest[];
  leaderboard: LeaderboardUser[];
  reminders: NotificationReminder[];
  shopItems: ShopItem[];
  soundEnabled: boolean;
  toggleSound: () => void;
  levelUpInfo: { newLevel: number; title: string; gemsAwarded: number } | null;
  dismissLevelUp: () => void;
  newAchievementUnlocked: Achievement | null;
  dismissAchievementToast: () => void;
  activeShareModal: boolean;
  setShareModal: (open: boolean) => void;
  activeNotificationModal: boolean;
  setNotificationModal: (open: boolean) => void;
  activeQuickLogModal: 'workout' | 'gym' | 'pushups' | 'meal' | 'custom' | null;
  setActiveQuickLogModal: (type: 'workout' | 'gym' | 'pushups' | 'meal' | 'custom' | null) => void;

  // Daily Boss Raid State & Actions
  dailyBossState: DailyBossState;
  activeBoss: BossDefinition;
  isBossModalOpen: boolean;
  setIsBossModalOpen: (open: boolean) => void;
  isChestModalOpen: boolean;
  setIsChestModalOpen: (open: boolean) => void;
  executeApexStrike: () => { damage: number; isCrit: boolean };
  claimBossLoot: () => BossLootDrop;

  // Actions
  addWorkout: (entry: {
    activityId: string;
    activityName: string;
    icon: string;
    category: WorkoutLogEntry['category'];
    durationMinutes: number;
    intensity: WorkoutLogEntry['intensity'];
    notes?: string;
    pushupReps?: number;
    gymExercises?: WorkoutLogEntry['gymExercises'];
  }) => void;
  addPushupSession: (reps: number, durationMinutes?: number, notes?: string) => void;
  addGymSession: (exerciseName: string, targetMuscle: string, sets: GymSet[], durationMinutes: number, notes?: string) => void;
  addMeal: (meal: Omit<MealEntry, 'id' | 'date'>) => void;
  deleteMeal: (mealId: string) => void;
  updateTodaySteps: (stepsDelta: number) => void;
  addWater: (ml: number) => void;
  createCustomActivity: (activity: Omit<ActivityTypeDefinition, 'id' | 'isCustom'>) => void;
  claimQuestReward: (questId: string) => void;
  claimAchievement: (achievementId: string) => void;
  sendHighFive: (userId: string) => void;
  buyShopItem: (itemId: string) => boolean;
  activateRestDayFreeze: () => boolean;
  restoreStreakWithPotion: () => boolean;
  toggleReminder: (reminderId: string) => void;
  triggerManualPushReminder: (reminder: NotificationReminder) => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'apexquest_user_v2',
  HISTORY: 'apexquest_history_v2',
  ACTIVITIES: 'apexquest_activities_v2',
  ACHIEVEMENTS: 'apexquest_achievements_v2',
  QUESTS: 'apexquest_quests_v2',
  LEADERBOARD: 'apexquest_leaderboard_v2',
  REMINDERS: 'apexquest_reminders_v2',
  SHOP: 'apexquest_shop_v2',
  SOUND: 'apexquest_sound_v2',
  DAILY_BOSS: 'apexquest_daily_boss_v1',
};

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayDate = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [user, setUser] = useState<UserStats>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : initialUser;
    } catch {
      return initialUser;
    }
  });

  const [history, setHistory] = useState<DailyActivity[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : generatePast30DaysHistory();
    } catch {
      return generatePast30DaysHistory();
    }
  });

  const [activityTypes, setActivityTypes] = useState<ActivityTypeDefinition[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return stored ? JSON.parse(stored) : defaultActivityTypes;
    } catch {
      return defaultActivityTypes;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return stored ? JSON.parse(stored) : initialAchievements;
    } catch {
      return initialAchievements;
    }
  });

  // Daily Boss State & Modal toggles
  const [dailyBossState, setDailyBossState] = useState<DailyBossState>(() => {
    try {
      const activeBossDef = getBossForDate(todayDate);
      const stored = localStorage.getItem(STORAGE_KEYS.DAILY_BOSS);
      if (stored) {
        const parsed: DailyBossState = JSON.parse(stored);
        if (parsed.date === todayDate) {
          return parsed;
        }
      }
      const initialMaxHp = calculateBossMaxHp(user);
      return {
        date: todayDate,
        bossId: activeBossDef.id,
        maxHp: initialMaxHp,
        currentHp: initialMaxHp,
        apexChargePercent: 0,
        isDefeated: false,
        chestClaimed: false,
        damageLog: [],
      };
    } catch {
      const activeBossDef = getBossForDate(todayDate);
      const initialMaxHp = calculateBossMaxHp(user);
      return {
        date: todayDate,
        bossId: activeBossDef.id,
        maxHp: initialMaxHp,
        currentHp: initialMaxHp,
        apexChargePercent: 0,
        isDefeated: false,
        chestClaimed: false,
        damageLog: [],
      };
    }
  });

  const activeBoss = useMemo(() => getBossForDate(dailyBossState.date), [dailyBossState.date]);
  const [isBossModalOpen, setIsBossModalOpen] = useState<boolean>(false);
  const [isChestModalOpen, setIsChestModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_BOSS, JSON.stringify(dailyBossState));
    } catch (e) {
      console.error('Failed to save daily boss state', e);
    }
  }, [dailyBossState]);

  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUESTS);
      return stored ? JSON.parse(stored) : initialDailyQuests;
    } catch {
      return initialDailyQuests;
    }
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      return stored ? JSON.parse(stored) : initialLeaderboard;
    } catch {
      return initialLeaderboard;
    }
  });

  const [reminders, setReminders] = useState<NotificationReminder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      return stored ? JSON.parse(stored) : initialReminders;
    } catch {
      return initialReminders;
    }
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHOP);
      return stored ? JSON.parse(stored) : initialShopItems;
    } catch {
      return initialShopItems;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SOUND);
      return s !== null ? JSON.parse(s) : true;
    } catch {
      return true;
    }
  });

  const [levelUpInfo, setLevelUpInfo] = useState<{ newLevel: number; title: string; gemsAwarded: number } | null>(null);
  const [newAchievementUnlocked, setNewAchievementUnlocked] = useState<Achievement | null>(null);
  const [activeShareModal, setShareModal] = useState<boolean>(false);
  const [activeNotificationModal, setNotificationModal] = useState<boolean>(false);
  const [activeQuickLogModal, setActiveQuickLogModal] = useState<'workout' | 'gym' | 'pushups' | 'meal' | 'custom' | null>(null);
  const [activeAuthModal, setActiveAuthModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Validate connection to Firestore on initialization
  useEffect(() => {
    validateFirestoreConnection();
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fireUser) => {
      setCurrentUser(fireUser);
      setAuthLoading(false);

      if (fireUser) {
        try {
          const userDocRef = doc(db, 'users', fireUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const cloud = userSnap.data();
            setUser((prev) => ({
              ...prev,
              id: fireUser.uid,
              name: fireUser.displayName || cloud.name || prev.name,
              email: fireUser.email || cloud.email || prev.email,
              avatar: fireUser.photoURL || cloud.avatar || prev.avatar,
              level: typeof cloud.level === 'number' ? cloud.level : prev.level,
              xp: typeof cloud.xp === 'number' ? cloud.xp : prev.xp,
              xpToNextLevel: typeof cloud.xpToNextLevel === 'number' ? cloud.xpToNextLevel : prev.xpToNextLevel,
              currentStreak: typeof cloud.currentStreak === 'number' ? cloud.currentStreak : prev.currentStreak,
              consecutiveTargetsStreak: typeof cloud.consecutiveTargetsStreak === 'number' ? cloud.consecutiveTargetsStreak : prev.consecutiveTargetsStreak,
              streakShields: typeof cloud.streakShields === 'number' ? cloud.streakShields : prev.streakShields,
              gems: typeof cloud.gems === 'number' ? cloud.gems : prev.gems,
              title: cloud.title || prev.title,
              rankTier: cloud.rankTier || prev.rankTier,
            }));
            setLastSyncedAt(new Date().toLocaleTimeString());
          } else {
            // First time login - initialize in Firestore
            setUser((prev) => ({
              ...prev,
              id: fireUser.uid,
              name: fireUser.displayName || prev.name,
              email: fireUser.email || undefined,
              avatar: fireUser.photoURL || prev.avatar,
            }));

            await setDoc(
              userDocRef,
              {
                id: fireUser.uid,
                name: fireUser.displayName || user.name,
                email: fireUser.email || '',
                avatar: fireUser.photoURL || user.avatar,
                level: user.level,
                title: user.title,
                rankTier: user.rankTier,
                xp: user.xp,
                xpToNextLevel: user.xpToNextLevel,
                totalXp: calculateCumulativeXp(user.level, user.xp),
                currentStreak: user.currentStreak,
                consecutiveTargetsStreak: user.consecutiveTargetsStreak,
                streakShields: user.streakShields,
                gems: user.gems,
                weightKg: user.weightKg,
                heightCm: user.heightCm,
                dailyGoalSteps: user.dailyGoalSteps,
                dailyGoalCaloriesBurn: user.dailyGoalCaloriesBurn,
                dailyCalorieBudget: user.dailyCalorieBudget,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );

            // Also synchronize sanitized public profile to leaderboard_entries (no email or health metrics)
            const publicLeaderboardRef = doc(db, 'leaderboard_entries', fireUser.uid);
            await setDoc(
              publicLeaderboardRef,
              {
                id: fireUser.uid,
                name: fireUser.displayName || user.name,
                avatar: fireUser.photoURL || user.avatar,
                level: user.level,
                title: user.title,
                rankTier: user.rankTier,
                xp: user.xp,
                totalXp: calculateCumulativeXp(user.level, user.xp),
                currentStreak: user.currentStreak,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );

            setLastSyncedAt(new Date().toLocaleTimeString());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${fireUser.uid}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Synchronize current user stats into the leaderboard
  useEffect(() => {
    const userTotalXp = calculateCumulativeXp(user.level, user.xp);
    setLeaderboard((prev) => {
      const exists = prev.some((p) => p.isUser);
      let updated: LeaderboardUser[];
      if (exists) {
        updated = prev.map((p) => {
          if (p.isUser) {
            return {
              ...p,
              username: `${user.name} (You)`,
              avatar: user.avatar,
              level: user.level,
              title: user.title,
              streak: user.currentStreak,
              totalXp: userTotalXp,
              league: user.rankTier,
            };
          }
          return p;
        });
      } else {
        const userEntry: LeaderboardUser = {
          id: user.id || 'lb-user',
          rank: 5,
          username: `${user.name} (You)`,
          avatar: user.avatar,
          level: user.level,
          title: user.title,
          weeklyXp: user.xp + 1500,
          totalXp: userTotalXp,
          streak: user.currentStreak,
          caloriesBurned: 2450,
          isUser: true,
          isFriend: false,
          league: user.rankTier,
          highFivesReceived: 18,
          badge: '🔥 Rising Star',
        };
        updated = [...prev, userEntry];
      }
      return updated;
    });
  }, [user.name, user.avatar, user.level, user.xp, user.title, user.currentStreak, user.rankTier]);

  // Listen for real Firestore public leaderboard entries to populate live global leaderboard
  useEffect(() => {
    try {
      const lbColRef = collection(db, 'leaderboard_entries');
      const unsubscribe = onSnapshot(
        lbColRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreUsers: LeaderboardUser[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data && data.name && docSnap.id !== currentUser?.uid) {
                const totalXp =
                  typeof data.totalXp === 'number'
                    ? data.totalXp
                    : data.xp
                    ? calculateCumulativeXp(data.level || 1, data.xp)
                    : 2500;
                firestoreUsers.push({
                  id: docSnap.id,
                  rank: 0,
                  username: data.name,
                  avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
                  level: data.level || 1,
                  title: data.title || 'Initiate',
                  weeklyXp: data.xp || 500,
                  totalXp,
                  streak: data.currentStreak || 1,
                  caloriesBurned: 1200,
                  isUser: false,
                  isFriend: false,
                  league: data.rankTier || 'Beginner',
                  highFivesReceived: 5,
                  badge: '🌐 Global',
                });
              }
            });

            if (firestoreUsers.length > 0) {
              setLeaderboard((prev) => {
                const existingMap = new Map(prev.map((u) => [u.id, u]));
                firestoreUsers.forEach((fu) => {
                  if (!existingMap.has(fu.id)) {
                    existingMap.set(fu.id, fu);
                  }
                });
                return Array.from(existingMap.values());
              });
            }
          }
        },
        (err) => {
          console.warn('Firestore leaderboard subscription warning:', err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not subscribe to firestore leaderboard:', e);
    }
  }, [currentUser?.uid]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activityTypes));
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
      localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(dailyQuests));
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(leaderboard));
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(shopItems));
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(soundEnabled));
    } catch {}
  }, [user, history, activityTypes, achievements, dailyQuests, leaderboard, reminders, shopItems, soundEnabled]);

  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const loginAction = async () => {
    try {
      await loginWithGoogle();
      sounds.playGemPing();
      notificationService.send('🔐 Firebase Connected', 'Signed in securely with Google Account!', '✨');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const loginWithEmailAction = async (email: string, pass: string) => {
    try {
      await loginWithEmail(email, pass);
      sounds.playGemPing();
      notificationService.send('⚔️ Welcome Back', 'Signed in with email account!', '✨');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const registerWithEmailAction = async (email: string, pass: string, displayName?: string) => {
    try {
      await registerWithEmail(email, pass, displayName);
      sounds.playQuestComplete();
      notificationService.send('🛡️ Warrior Registered', `Welcome to Yodha, ${displayName || 'Warrior'}!`, '✨');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const loginGuestAction = async () => {
    try {
      await loginAnonymously();
      sounds.playStreakFlame();
      notificationService.send('👤 Guest Mode Active', 'Anonymous cloud session initialized.', '☁️');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const resetPasswordAction = async (email: string) => {
    try {
      await sendPasswordReset(email);
      notificationService.send('📬 Password Reset Sent', `Check ${email} for recovery link.`, '✉️');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const syncCloudData = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const totalCumulativeXp = calculateCumulativeXp(user.level, user.xp);
      await setDoc(
        userDocRef,
        {
          id: currentUser.uid,
          name: currentUser.displayName || user.name,
          email: currentUser.email || '',
          avatar: currentUser.photoURL || user.avatar,
          level: user.level,
          title: user.title,
          rankTier: user.rankTier,
          xp: user.xp,
          xpToNextLevel: user.xpToNextLevel,
          totalXp: totalCumulativeXp,
          currentStreak: user.currentStreak,
          consecutiveTargetsStreak: user.consecutiveTargetsStreak,
          streakShields: user.streakShields,
          gems: user.gems,
          weightKg: user.weightKg,
          heightCm: user.heightCm,
          dailyGoalSteps: user.dailyGoalSteps,
          dailyGoalCaloriesBurn: user.dailyGoalCaloriesBurn,
          dailyCalorieBudget: user.dailyCalorieBudget,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Sync public entry without email or health metrics
      const publicLbRef = doc(db, 'leaderboard_entries', currentUser.uid);
      await setDoc(
        publicLbRef,
        {
          id: currentUser.uid,
          name: currentUser.displayName || user.name,
          avatar: currentUser.photoURL || user.avatar,
          level: user.level,
          title: user.title,
          rankTier: user.rankTier,
          xp: user.xp,
          totalXp: totalCumulativeXp,
          currentStreak: user.currentStreak,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setLastSyncedAt(new Date().toLocaleTimeString());
      notificationService.send('☁️ Cloud Synced', 'All stats and streaks backed up to Firestore.', '⚡');
    } catch (err) {
      console.error('Cloud sync error:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const logoutAction = async () => {
    try {
      await logoutUser();
      notificationService.send('👋 Signed Out', 'Signed out from Firebase.', 'ℹ️');
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to get or create today's activity record
  const getTodayRecord = (): DailyActivity => {
    const existing = history.find((h) => h.date === todayDate);
    if (existing) return existing;
    return {
      date: todayDate,
      steps: 0,
      activeMinutes: 0,
      caloriesBurned: 0,
      waterMl: 0,
      meals: [],
      workouts: [],
      goalMet: false,
    };
  };

  const todayActivity = getTodayRecord();
  const selectedDayActivity = history.find((h) => h.date === selectedDate) || {
    date: selectedDate,
    steps: 0,
    activeMinutes: 0,
    caloriesBurned: 0,
    waterMl: 0,
    meals: [],
    workouts: [],
    goalMet: false,
  };

  // Check and update consecutive targets streak
  const checkConsecutiveTargets = (currHistory: DailyActivity[]) => {
    const today = currHistory.find((h) => h.date === todayDate);
    if (!today) return;

    const bmr = calculateBMR(user.weightKg, user.heightCm, user.age, user.gender);
    const foodCal = today.meals.reduce((sum, m) => sum + m.calories, 0);
    const workoutBurn = today.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    const stepBurn = calculateStepCalories(today.steps, user.weightKg);
    const net = calculateNetCalories(foodCal, bmr, workoutBurn, stepBurn);

    const isCalorieTargetMet = today.meals.length >= 2 && foodCal <= user.dailyCalorieBudget && net.net <= 150;
    const isActivityTargetMet = today.steps >= 8000 || today.caloriesBurned >= 500;
    const bothMet = isCalorieTargetMet && isActivityTargetMet;

    if (bothMet) {
      setUser((prev) => {
        const nextConsecutive = prev.consecutiveTargetsStreak + 1;
        return {
          ...prev,
          consecutiveTargetsStreak: nextConsecutive,
        };
      });

      // Save quest log to Firestore if logged in
      if (currentUser) {
        try {
          const logRef = doc(db, 'users', currentUser.uid, 'quest_logs', todayDate);
          setDoc(
            logRef,
            {
              date: todayDate,
              steps: today.steps,
              caloriesBurned: today.caloriesBurned,
              foodCalories: foodCal,
              netCalories: net.net,
              activityTargetMet: isActivityTargetMet,
              calorieTargetMet: isCalorieTargetMet,
              bothTargetsMet: true,
              consecutiveStreak: user.consecutiveTargetsStreak + 1,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/quest_logs/${todayDate}`);
        }
      }
    }
  };

  // Internal XP reward and level-up system (Beginner Level 1-5 then Master)
  const awardXp = (amount: number, attribute?: keyof UserStats['rpgAttributes']) => {
    setUser((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let xpThreshold = prev.xpToNextLevel;
      let didLevelUp = false;
      let gemReward = 0;

      while (newXp >= xpThreshold) {
        newXp -= xpThreshold;
        newLevel += 1;
        xpThreshold = getXpForLevel(newLevel);
        didLevelUp = true;
        gemReward += newLevel * 20;
      }

      const newTitle = getPlayerTitle(newLevel);
      const newRankTier = getRankTier(newLevel);

      const newAttributes = { ...prev.rpgAttributes };
      if (attribute) {
        newAttributes[attribute] = (newAttributes[attribute] || 10) + Math.max(1, Math.floor(amount / 50));
      }

      if (didLevelUp) {
        sounds.playLevelUp();
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'],
        });
        setLevelUpInfo({
          newLevel,
          title: newTitle,
          gemsAwarded: gemReward,
        });

        notificationService.send(
          '🎉 LEVEL UP! Ascended to Level ' + newLevel,
          `You earned "${newTitle}" (${newRankTier}) and +${gemReward} Gems!`,
          '👑'
        );
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpToNextLevel: xpThreshold,
        title: newTitle,
        rankTier: newRankTier,
        gems: prev.gems + gemReward,
        rpgAttributes: newAttributes,
      };
    });
  };

  // Check achievements against current stats
  const checkAchievements = (statsToCheck: {
    totalPushups?: number;
    totalGymSessions?: number;
    streak?: number;
    totalBurn?: number;
  }) => {
    setAchievements((prev) =>
      prev.map((ach) => {
        if (ach.unlocked) return ach;
        let newProgress = ach.progress;

        if (ach.category === 'pushups' && statsToCheck.totalPushups !== undefined) {
          newProgress = Math.min(ach.maxProgress, statsToCheck.totalPushups);
        } else if (ach.category === 'gym' && statsToCheck.totalGymSessions !== undefined) {
          newProgress = Math.min(ach.maxProgress, statsToCheck.totalGymSessions);
        } else if (ach.category === 'streak' && statsToCheck.streak !== undefined) {
          newProgress = Math.min(ach.maxProgress, statsToCheck.streak);
        }

        const isNewlyUnlocked = newProgress >= ach.maxProgress;
        if (isNewlyUnlocked) {
          sounds.playQuestComplete();
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.7 },
          });
          setNewAchievementUnlocked({
            ...ach,
            progress: newProgress,
            unlocked: true,
            unlockedAt: todayDate,
          });
          notificationService.send('🏆 Milestone Achieved!', `"${ach.title}" - +${ach.xpReward} XP & +${ach.gemReward} Gems!`, '🏅');
          awardXp(ach.xpReward);
          setUser((u) => ({ ...u, gems: u.gems + ach.gemReward }));
        }

        return {
          ...ach,
          progress: newProgress,
          unlocked: isNewlyUnlocked,
          unlockedAt: isNewlyUnlocked ? todayDate : ach.unlockedAt,
        };
      })
    );
  };

  // Inflict damage to daily boss from fitness activity
  const inflictBossDamage = (activity: ActivityDamageInput, sourceName: string) => {
    setDailyBossState((prev) => {
      if (prev.isDefeated) return prev;

      const result = calculateActivityDamage(activity, activeBoss, user);
      const nextHp = Math.max(0, prev.currentHp - result.damage);
      const isDefeated = nextHp === 0;

      const logEntry: DailyBossDamageLogEntry = {
        id: `dmg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: sourceName,
        damage: result.damage,
        isCrit: result.isCrit,
        isWeakness: result.weaknessBonus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (isDefeated && !prev.isDefeated) {
        sounds.playLevelUp();
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      }

      const chargeDelta = activity.category === 'pushups' ? 15 : 35;
      const nextCharge = Math.min(100, prev.apexChargePercent + chargeDelta);

      return {
        ...prev,
        currentHp: nextHp,
        isDefeated,
        apexChargePercent: nextCharge,
        damageLog: [logEntry, ...prev.damageLog].slice(0, 30),
      };
    });
  };

  const executeApexStrike = useCallback(() => {
    if (dailyBossState.isDefeated || dailyBossState.apexChargePercent < 50) {
      return { damage: 0, isCrit: false };
    }

    const result = executeApexStrikeDamage(activeBoss, user);
    sounds.playBossStrike();

    setDailyBossState((prev) => {
      const nextHp = Math.max(0, prev.currentHp - result.damage);
      const isDefeated = nextHp === 0;
      const logEntry: DailyBossDamageLogEntry = {
        id: `dmg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: '⚡ Apex Burst Strike',
        damage: result.damage,
        isCrit: result.isCrit,
        isWeakness: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (isDefeated && !prev.isDefeated) {
        sounds.playLevelUp();
        confetti({ particleCount: 100, spread: 85, origin: { y: 0.6 } });
      }

      return {
        ...prev,
        currentHp: nextHp,
        apexChargePercent: Math.max(0, prev.apexChargePercent - 50),
        isDefeated,
        damageLog: [logEntry, ...prev.damageLog].slice(0, 30),
      };
    });

    return result;
  }, [dailyBossState.isDefeated, dailyBossState.apexChargePercent, activeBoss, user]);

  const claimBossLoot = useCallback((): BossLootDrop => {
    if (!dailyBossState.isDefeated || dailyBossState.chestClaimed) {
      return {
        gems: 0,
        xp: 0,
        streakShields: 0,
        statPoints: {},
      };
    }

    const loot = generateBossLoot(activeBoss, user);

    setUser((prev) => {
      const nextGems = prev.gems + loot.gems;
      const nextStreakShields = prev.streakShields + loot.streakShields;
      const nextStats = { ...prev.rpgAttributes };

      if (loot.statPoints.strength) nextStats.strength = (nextStats.strength || 10) + loot.statPoints.strength;
      if (loot.statPoints.stamina) nextStats.stamina = (nextStats.stamina || 10) + loot.statPoints.stamina;
      if (loot.statPoints.agility) nextStats.agility = (nextStats.agility || 10) + loot.statPoints.agility;
      if (loot.statPoints.discipline) nextStats.discipline = (nextStats.discipline || 10) + loot.statPoints.discipline;

      return {
        ...prev,
        gems: nextGems,
        streakShields: nextStreakShields,
        rpgAttributes: nextStats,
      };
    });

    awardXp(loot.xp);

    setDailyBossState((prev) => ({
      ...prev,
      chestClaimed: true,
    }));

    sounds.playChestOpen();
    confetti({ particleCount: 120, spread: 85, origin: { y: 0.5 } });

    return loot;
  }, [dailyBossState.isDefeated, dailyBossState.chestClaimed, activeBoss, user]);

  // Add generic workout
  const addWorkout = ({
    activityId,
    activityName,
    icon,
    category,
    durationMinutes,
    intensity,
    notes,
    pushupReps,
    gymExercises,
  }: {
    activityId: string;
    activityName: string;
    icon: string;
    category: WorkoutLogEntry['category'];
    durationMinutes: number;
    intensity: WorkoutLogEntry['intensity'];
    notes?: string;
    pushupReps?: number;
    gymExercises?: WorkoutLogEntry['gymExercises'];
  }) => {
    const actDef = activityTypes.find((a) => a.id === activityId);
    const met = actDef ? actDef.metValue : 6.0;

    let calBurned = calculateWorkoutCalories(met, durationMinutes, user.weightKg, intensity);
    if (pushupReps && pushupReps > 0) {
      calBurned = Math.max(calBurned, calculatePushupCalories(pushupReps, user.weightKg));
    }

    const xp = Math.round(durationMinutes * 6 + (pushupReps || 0) * 3 + calBurned * 0.4);

    const newWorkout: WorkoutLogEntry = {
      id: `w-${Date.now()}`,
      activityId,
      activityName,
      icon,
      category,
      durationMinutes,
      caloriesBurned: calBurned,
      intensity,
      timestamp: new Date().toISOString(),
      date: todayDate,
      pushupReps,
      gymExercises,
      xpGained: xp,
      notes,
    };

    // Save to Firestore if user logged in
    if (currentUser) {
      try {
        const workoutRef = doc(db, 'users', currentUser.uid, 'workouts', newWorkout.id);
        setDoc(workoutRef, {
          id: newWorkout.id,
          activityName: newWorkout.activityName,
          category: newWorkout.category,
          durationMinutes: newWorkout.durationMinutes,
          caloriesBurned: newWorkout.caloriesBurned,
          intensity: newWorkout.intensity,
          pushupReps: newWorkout.pushupReps || 0,
          date: newWorkout.date,
          xpGained: newWorkout.xpGained,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/workouts/${newWorkout.id}`);
      }
    }

    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.date === todayDate);
      let nextHistory: DailyActivity[];
      if (idx >= 0) {
        const current = prev[idx];
        const updatedWorkouts = [newWorkout, ...current.workouts];
        const updatedBurn = current.caloriesBurned + calBurned;
        const updatedMins = current.activeMinutes + durationMinutes;
        const updated = {
          ...current,
          workouts: updatedWorkouts,
          caloriesBurned: updatedBurn,
          activeMinutes: updatedMins,
          goalMet: updatedBurn >= user.dailyGoalCaloriesBurn || current.steps >= user.dailyGoalSteps,
        };
        nextHistory = [...prev];
        nextHistory[idx] = updated;
      } else {
        nextHistory = [
          {
            date: todayDate,
            steps: 0,
            activeMinutes: durationMinutes,
            caloriesBurned: calBurned,
            waterMl: 0,
            meals: [],
            workouts: [newWorkout],
            goalMet: calBurned >= user.dailyGoalCaloriesBurn,
          },
          ...prev,
        ];
      }
      checkConsecutiveTargets(nextHistory);
      return nextHistory;
    });

    // Attribute boost
    const attributeMap: Record<WorkoutLogEntry['category'], keyof UserStats['rpgAttributes']> = {
      pushups: 'strength',
      gym: 'strength',
      cardio: 'stamina',
      hiit: 'agility',
      flexibility: 'stamina',
      custom: 'discipline',
    };
    awardXp(xp, attributeMap[category]);
    sounds.playQuestComplete();

    // Inflict automatic damage to active daily boss
    inflictBossDamage(newWorkout, newWorkout.activityName);

    // Update quest progress
    updateQuestProgress('workout', calBurned);
    if (pushupReps) {
      updateQuestProgress('pushups', pushupReps);
    }
  };

  // Add dedicated pushup session
  const addPushupSession = (reps: number, durationMinutes: number = 10, notes?: string) => {
    addWorkout({
      activityId: 'act-pushups',
      activityName: 'Pushup Mastery',
      icon: 'Dumbbell',
      category: 'pushups',
      durationMinutes,
      intensity: 'vigorous',
      pushupReps: reps,
      notes: notes || `Recorded ${reps} disciplined pushup reps.`,
    });
  };

  // Add indoor gym session
  const addGymSession = (
    exerciseName: string,
    targetMuscle: string,
    sets: GymSet[],
    durationMinutes: number,
    notes?: string
  ) => {
    const gymExercises = [
      {
        id: `ge-${Date.now()}`,
        exerciseName,
        targetMuscle,
        sets,
      },
    ];

    addWorkout({
      activityId: 'act-gym',
      activityName: `Gym: ${exerciseName}`,
      icon: 'Flame',
      category: 'gym',
      durationMinutes,
      intensity: 'vigorous',
      gymExercises,
      notes: notes || `Completed ${sets.length} sets targeting ${targetMuscle}.`,
    });
  };

  // Add meal (supports Indian Cuisine and photoUrl)
  const addMeal = (meal: Omit<MealEntry, 'id' | 'date'>) => {
    const newMeal: MealEntry = {
      ...meal,
      id: `m-${Date.now()}`,
      date: todayDate,
    };

    // Save to Firestore if user logged in
    if (currentUser) {
      try {
        const mealRef = doc(db, 'users', currentUser.uid, 'meals', newMeal.id);
        setDoc(mealRef, {
          id: newMeal.id,
          name: newMeal.name,
          mealType: newMeal.mealType,
          calories: newMeal.calories,
          proteinG: newMeal.proteinG,
          carbsG: newMeal.carbsG,
          fatG: newMeal.fatG,
          photoUrl: newMeal.photoUrl || '',
          isIndianCuisine: Boolean(newMeal.isIndianCuisine),
          date: newMeal.date,
          time: newMeal.time,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/meals/${newMeal.id}`);
      }
    }

    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.date === todayDate);
      let nextHistory: DailyActivity[];
      if (idx >= 0) {
        const current = prev[idx];
        const updated = {
          ...current,
          meals: [...current.meals, newMeal],
        };
        nextHistory = [...prev];
        nextHistory[idx] = updated;
      } else {
        nextHistory = [
          {
            date: todayDate,
            steps: 0,
            activeMinutes: 0,
            caloriesBurned: 0,
            waterMl: 0,
            meals: [newMeal],
            workouts: [],
            goalMet: false,
          },
          ...prev,
        ];
      }
      checkConsecutiveTargets(nextHistory);
      return nextHistory;
    });

    awardXp(35, 'discipline');
    sounds.playGemPing();
    updateQuestProgress('nutrition', 1);
  };

  // Delete meal
  const deleteMeal = (mealId: string) => {
    if (currentUser) {
      deleteDoc(doc(db, 'users', currentUser.uid, 'meals', mealId)).catch((err) => {
        console.warn('Could not delete meal from firestore:', err);
      });
    }

    setHistory((prev) => {
      const nextHistory = prev.map((day) => {
        if (day.date === todayDate) {
          return {
            ...day,
            meals: day.meals.filter((m) => m.id !== mealId),
          };
        }
        return day;
      });
      checkConsecutiveTargets(nextHistory);
      return nextHistory;
    });
  };

  // Update today steps
  const updateTodaySteps = (stepsDelta: number) => {
    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.date === todayDate);
      const stepCalBurn = calculateStepCalories(stepsDelta, user.weightKg);

      let nextHistory: DailyActivity[];
      if (idx >= 0) {
        const current = prev[idx];
        const newSteps = Math.max(0, current.steps + stepsDelta);
        const newBurn = current.caloriesBurned + stepCalBurn;
        const updated = {
          ...current,
          steps: newSteps,
          caloriesBurned: newBurn,
          goalMet: newSteps >= user.dailyGoalSteps || newBurn >= user.dailyGoalCaloriesBurn,
        };
        nextHistory = [...prev];
        nextHistory[idx] = updated;
      } else {
        nextHistory = [
          {
            date: todayDate,
            steps: stepsDelta,
            activeMinutes: Math.round(stepsDelta / 100),
            caloriesBurned: stepCalBurn,
            waterMl: 0,
            meals: [],
            workouts: [],
            goalMet: stepsDelta >= user.dailyGoalSteps,
          },
          ...prev,
        ];
      }
      checkConsecutiveTargets(nextHistory);
      return nextHistory;
    });

    updateQuestProgress('steps', stepsDelta);
    awardXp(Math.round(stepsDelta * 0.02), 'stamina');
    sounds.playRepCount();

    if (stepsDelta > 0) {
      inflictBossDamage({ category: 'cardio', steps: stepsDelta }, `${stepsDelta.toLocaleString()} Steps Kinetic Strike`);
    }
  };

  // Add water
  const addWater = (ml: number) => {
    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.date === todayDate);
      if (idx >= 0) {
        const current = prev[idx];
        const newWater = current.waterMl + ml;
        const updated = { ...current, waterMl: newWater };
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return prev;
    });

    updateQuestProgress('water', ml);
    sounds.playGemPing();
    awardXp(15, 'discipline');
  };

  // Custom activity type creator
  const createCustomActivity = (act: Omit<ActivityTypeDefinition, 'id' | 'isCustom'>) => {
    const newDef: ActivityTypeDefinition = {
      ...act,
      id: `act-custom-${Date.now()}`,
      isCustom: true,
    };
    setActivityTypes((prev) => [...prev, newDef]);
    sounds.playQuestComplete();
    notificationService.send('🎯 Custom Activity Created', `Added "${newDef.name}" to your battle arsenal!`, '✨');
  };

  // Update Quest Progress helper
  const updateQuestProgress = (category: DailyQuest['category'], delta: number) => {
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.category !== category || q.completed) return q;
        const nextVal = q.current + delta;
        const completed = nextVal >= q.target;
        if (completed && !q.completed) {
          sounds.playQuestComplete();
        }
        return {
          ...q,
          current: nextVal,
          completed,
        };
      })
    );
  };

  // Claim Quest Reward
  const claimQuestReward = (questId: string) => {
    setDailyQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && q.completed && !q.claimed) {
          sounds.playGemPing();
          awardXp(q.xpReward);
          setUser((u) => ({ ...u, gems: u.gems + q.gemReward }));
          notificationService.send('💎 Reward Claimed!', `+${q.xpReward} XP & +${q.gemReward} Gems earned from Daily Quest!`, '⚔️');
          return { ...q, claimed: true };
        }
        return q;
      })
    );
  };

  // Claim Achievement
  const claimAchievement = (achievementId: string) => {
    setAchievements((prev) =>
      prev.map((a) => {
        if (a.id === achievementId && a.unlocked) {
          sounds.playGemPing();
          return a;
        }
        return a;
      })
    );
  };

  // Send high-five on leaderboard
  const sendHighFive = (userId: string) => {
    setLeaderboard((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          sounds.playGemPing();
          return {
            ...u,
            highFivesReceived: u.highFivesReceived + 1,
            hasHighFivedToday: true,
          };
        }
        return u;
      })
    );
    awardXp(25, 'discipline');
    notificationService.send('🙌 High-Five Sent!', 'Sportsmanship rewarded with +25 XP!', '🔥');
  };

  // Shop purchase
  const buyShopItem = (itemId: string): boolean => {
    const item = shopItems.find((s) => s.id === itemId);
    if (!item || user.gems < item.costGems) {
      return false;
    }

    sounds.playQuestComplete();
    setUser((u) => {
      let newShields = u.streakShields;
      let newTitle = u.title;
      let nextStreak = u.currentStreak;

      if (item.id === 'shop-streak-freeze-pack') {
        newShields += 3;
      } else if (item.category === 'shield' || item.id === 'shop-streak-shield') {
        newShields += 1;
      } else if (item.id === 'shop-streak-resurrect') {
        nextStreak = Math.max(u.longestStreak, u.currentStreak + 5);
      } else if (item.category === 'title') {
        newTitle = 'Master Ascendant';
      }

      return {
        ...u,
        gems: u.gems - item.costGems,
        streakShields: newShields,
        title: newTitle,
        currentStreak: nextStreak,
      };
    });

    if (item.category === 'title' || item.category === 'cosmetic') {
      setShopItems((prev) =>
        prev.map((s) => (s.id === itemId ? { ...s, purchased: true } : s))
      );
    }

    notificationService.send('🛍️ Item Acquired', `Purchased "${item.title}" successfully!`, '💎');
    return true;
  };

  // Rest Day Freeze activation
  const activateRestDayFreeze = (): boolean => {
    if (user.streakShields <= 0) {
      notificationService.send('🛡️ No Shields Available', 'Acquire an Aegis Shield from the Shop using Gems.', '⚠️');
      return false;
    }
    const today = getTodayRecord();
    if (today.streakFrozen) {
      notificationService.send('❄️ Already Protected', 'Today is already protected under a Rest Day Freeze.', 'ℹ️');
      return false;
    }

    // Decrement 1 shield
    setUser((prev) => ({
      ...prev,
      streakShields: Math.max(0, prev.streakShields - 1),
    }));

    // Mark today's record as frozen and goalMet so streak doesn't break
    setHistory((prev) => {
      const idx = prev.findIndex((h) => h.date === todayDate);
      let nextHistory: DailyActivity[];
      if (idx >= 0) {
        nextHistory = [...prev];
        nextHistory[idx] = {
          ...nextHistory[idx],
          streakFrozen: true,
          goalMet: true,
        };
      } else {
        nextHistory = [
          {
            date: todayDate,
            steps: 0,
            activeMinutes: 0,
            caloriesBurned: 0,
            waterMl: 0,
            meals: [],
            workouts: [],
            goalMet: true,
            streakFrozen: true,
          },
          ...prev,
        ];
      }
      return nextHistory;
    });

    sounds.playStreakFlame();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#38bdf8', '#e0f2fe', '#67e8f9'],
    });

    notificationService.send(
      '❄️ Rest Day Shield Active!',
      'Your streak is safely cryo-frozen for today. Rest and recover!',
      '🛡️'
    );
    return true;
  };

  // Restore broken streak with Phoenix Elixir
  const restoreStreakWithPotion = (): boolean => {
    const costGems = 150;
    if (user.gems < costGems) {
      notificationService.send('💎 Insufficient Gems', `Restoring your streak requires ${costGems} Gems.`, '⚠️');
      return false;
    }

    const revivedStreak = Math.max(user.longestStreak, user.currentStreak + 7);

    setUser((prev) => ({
      ...prev,
      gems: prev.gems - costGems,
      currentStreak: revivedStreak,
    }));

    sounds.playLevelUp();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#ef4444', '#f97316', '#fbbf24'],
    });

    notificationService.send(
      '🔥 Streak Resurrected!',
      `Phoenix Elixir restored your flame to ${revivedStreak} days!`,
      '✨'
    );
    return true;
  };

  // Toggle Push Reminder
  const toggleReminder = async (reminderId: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === reminderId) {
          const next = !r.enabled;
          if (next) {
            notificationService.requestPermission();
          }
          return { ...r, enabled: next };
        }
        return r;
      })
    );
  };

  // Trigger manual reminder test
  const triggerManualPushReminder = (reminder: NotificationReminder) => {
    sounds.playStreakFlame();
    notificationService.send(reminder.title, reminder.message, '⚡');
  };

  return (
    <FitnessContext.Provider
      value={{
        user,
        currentUser,
        authLoading,
        loginAction,
        logoutAction,
        loginWithEmailAction,
        registerWithEmailAction,
        loginGuestAction,
        resetPasswordAction,
        syncCloudData,
        isSyncing,
        lastSyncedAt,
        activeAuthModal,
        setActiveAuthModal,
        todayDate,
        selectedDate,
        setSelectedDate,
        todayActivity,
        selectedDayActivity,
        history,
        activityTypes,
        achievements,
        dailyQuests,
        leaderboard,
        reminders,
        shopItems,
        soundEnabled,
        toggleSound,
        levelUpInfo,
        dismissLevelUp: () => setLevelUpInfo(null),
        newAchievementUnlocked,
        dismissAchievementToast: () => setNewAchievementUnlocked(null),
        activeShareModal,
        setShareModal,
        activeNotificationModal,
        setNotificationModal,
        activeQuickLogModal,
        setActiveQuickLogModal,
        dailyBossState,
        activeBoss,
        isBossModalOpen,
        setIsBossModalOpen,
        isChestModalOpen,
        setIsChestModalOpen,
        executeApexStrike,
        claimBossLoot,
        addWorkout,
        addPushupSession,
        addGymSession,
        addMeal,
        deleteMeal,
        updateTodaySteps,
        addWater,
        createCustomActivity,
        claimQuestReward,
        claimAchievement,
        sendHighFive,
        buyShopItem,
        activateRestDayFreeze,
        restoreStreakWithPotion,
        toggleReminder,
        triggerManualPushReminder,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
};

export function useFitness() {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
}
