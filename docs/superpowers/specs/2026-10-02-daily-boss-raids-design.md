# Feature Specification: Daily Boss Raids & Dungeon Encounters

- **Status:** Approved
- **Date:** 2026-10-02
- **Topic:** Daily Boss Raids & Dungeon Encounters (Sub-Project 1)
- **Path:** Architectural

---

## 1. Overview & Goal

ApexQuest turns fitness workouts and daily discipline into a tangible RPG combat loop. **Daily Boss Raids** introduces a daily rotating Titan encounter whose Health Points (HP) scale adaptively to the player's personal goals and level. 

Workouts, steps, and gym volume passively inflict elemental and physical damage against the boss throughout the day. Players can also enter an interactive combat arena to unleash active **Apex Strikes** with visual impact effects, floating combat text, and sound effects. Slashing the boss to 0 HP unlocks a multi-tier **Slayer's Victory Chest** filled with Gems, RPG Attribute stat points (+STR, +STA, +AGI, +DISC), Streak Shield consumables, and exclusive Slayer Titles.

---

## 2. Core Mechanics & Formulas

### 2.1 Adaptive Boss HP Scaling
Each day at 00:00 local time, a daily boss is initialized. Its maximum HP is calculated using the warrior's current level and custom fitness targets:

$$\text{Max HP} = \text{round}\Big(\big(200 + \text{dailyGoalCaloriesBurn} \times 1.5 + \text{dailyGoalSteps} \times 0.15\big) \times \big(1 + \text{level} \times 0.04\big)\Big)$$

*Example:* At Level 5, with a 500 kcal burn goal and 10,000 steps goal:
$$\text{Max HP} = \text{round}\Big((200 + 750 + 1500) \times (1 + 0.20)\Big) = 2,940\text{ HP}$$

### 2.2 Combat Damage Formulas
Fitness activities convert into combat damage based on activity category and the player's four RPG attributes (`strength`, `stamina`, `agility`, `discipline`):

1. **Pushups & Gym Volume (Physical / Heavy Damage):**
   * Pushups: $\text{Damage} = (\text{Reps} \times 3.0) \times (1 + \text{strength} \times 0.02)$
   * Gym Sets: $\text{Damage} = (\text{Total Weight Moved} \times 0.05 + \text{Sets Completed} \times 20) \times (1 + \text{strength} \times 0.02)$
2. **Cardio & Daily Steps (Kinetic / Velocity Damage):**
   * Steps: $\text{Damage} = (\text{Steps} \times 0.08) \times (1 + \text{stamina} \times 0.02)$
   * Running / Cycling: $\text{Damage} = (\text{DurationMinutes} \times 8 + \text{CaloriesBurned} \times 0.5) \times (1 + \text{stamina} \times 0.02)$
3. **HIIT & Calisthenics (Burst / Fire Damage):**
   * $\text{Damage} = (\text{CaloriesBurned} \times 0.9) \times (1 + \text{agility} \times 0.02)$
4. **Elemental Weakness Multiplier:**
   * If an activity matches the Boss's specific `weakness`, damage dealt is multiplied by **$1.5\times$ (+50%)**.
5. **Active Apex Strike (Active Burst Attack):**
   * Accumulates charge (0% to 100%) through logged fitness activities (each completed workout adds +35% charge; every 2,500 steps adds +25% charge).
   * Tapping **"ENGAGE APEX STRIKE"** in the Boss Battle Modal consumes 50% charge.
   * Strike Base Damage = $\text{round}(150 \times (1 + \text{level} \times 0.05))$.
   * Critical Hit Chance = $15\% + (\text{discipline} \times 1.5\%) + (\text{currentStreak} \times 1\%)$ (capped at 75%).
   * Critical Hit Multiplier = $2.0\times$.

---

## 3. Thematic 7-Day Boss Roster

Bosses rotate deterministically based on day of week:

| Day | Boss Name | Title | Element | Weakness | Resistance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Monday** | *Ironclad Goliath* | The Unbroken Wall | Earth | `gym` | Wind |
| **Tuesday** | *Zephyr Storm Drake* | Gale of the Peaks | Wind | `cardio` | Earth |
| **Wednesday** | *Obsidian Colossus* | Core of the Deep | Void | `pushups` | Fire |
| **Thursday** | *Ignis Pyre Behemoth* | The Cinder Lord | Fire | `hiit` | Ice |
| **Friday** | *Venomfang Wyrm* | Coil of Ruin | Poison | `flexibility` | Earth |
| **Saturday** | *Frost Dreadnought* | Glacier Sovereign | Ice | High Burn (`cardio`/`hiit`) | Water |
| **Sunday** | *Apex Shadow Overlord* | Weekly Raid Titan | Shadow | All Disciplines | None |

---

## 4. Multi-Tier Victory Chest & Rewards

When the Boss reaches 0 HP, `isDefeated` is set to `true`. Opening the **Slayer's Victory Chest** grants:
* **Gems:** +15 to +25 Gems (deposited into user balance).
* **XP Bounty:** +400 to +750 XP (triggers Level Up evaluation if threshold is met).
* **Consumables:** +1 Streak Shield (protects streak if a day is missed).
* **Attribute Boost:** Permanent +1 stat increase to one or two attributes (`strength`, `stamina`, `agility`, or `discipline`).
* **Title Unlock:** Specific Boss Slayer title (e.g. *"Slayer of the Ironclad"*, *"Apex Behemoth Conqueror"*).

---

## 5. Component Architecture & UI Specification

### 5.1 `BossRaidBannerCard.tsx`
- **Location:** Embedded in [`src/views/DashboardView.tsx`](file:///c:/Users/Kallol%20Bera/Downloads/apexquest-fitness_-rpg-tracker/src/views/DashboardView.tsx) and [`src/views/WorkoutView.tsx`](file:///c:/Users/Kallol%20Bera/Downloads/apexquest-fitness_-rpg-tracker/src/views/WorkoutView.tsx).
- **Appearance:** Dark fantasy glassmorphism container with animated elemental border glow.
- **Content:** Boss portrait, title, current HP progress bar (`currentHp / maxHp`), weakness pill tag (`Weakness: Gym Strength`), and "BATTLE RAID" interactive button with pulsing glow.
- **Status Badges:** Shows "DEFEATED - REWARDS READY" when at 0 HP with unclaimed chest, or "VICTORY ACHIEVED" when loot is claimed.

### 5.2 `BossBattleModal.tsx`
- **Location:** [`src/components/BossBattleModal.tsx`](file:///c:/Users/Kallol%20Bera/Downloads/apexquest-fitness_-rpg-tracker/src/components/BossBattleModal.tsx)
- **Accessibility:** Uses `useDialogAccessibility` with <kbd>Escape</kbd> dismissal, focus trapping, `role="dialog"`, and `aria-labelledby="boss-battle-title"`.
- **Interactions:**
  - Boss portrait with animated hit-react screen shake.
  - Smooth animated HP meter (gradient shifts from Emerald $\to$ Amber $\to$ Rose as health drops).
  - Floating combat text animations on attack.
  - Large **"⚡ ENGAGE APEX STRIKE"** button displaying remaining Apex Charge.
  - Combat event log listing today's damage sources.
  - On defeat, transitions to `VictoryChestModal`.

### 5.3 `VictoryChestModal.tsx`
- **Location:** [`src/components/VictoryChestModal.tsx`](file:///c:/Users/Kallol%20Bera/Downloads/apexquest-fitness_-rpg-tracker/src/components/VictoryChestModal.tsx)
- **Interactions:**
  - Golden chest with floating idle animation.
  - Click to unlock: triggers `canvas-confetti` explosion and fanfare sound.
  - Displays reward cards (Gems, XP, Stat Point, Streak Shield, Title).
  - "Claim Rewards & Close" button updates `FitnessContext` state.

---

## 6. State Management & Data Persistence

### 6.1 State Additions in `FitnessContextType`
```typescript
interface FitnessContextType {
  // ... existing fields ...
  dailyBossState: DailyBossState;
  activeBoss: BossDefinition;
  executeApexStrike: () => { damage: number; isCrit: boolean };
  claimBossLoot: () => BossLootDrop;
  isBossModalOpen: boolean;
  setIsBossModalOpen: (open: boolean) => void;
  isChestModalOpen: boolean;
  setIsChestModalOpen: (open: boolean) => void;
}
```

### 6.2 Persistence Strategy
- Key in `localStorage`: `apexquest_daily_boss_state`.
- Key in Firestore: `users/{uid}/dailyBoss/{YYYY-MM-DD}`.
- If the cached date in `dailyBossState.date !== todayDate`, the state is reset with a fresh boss for today while archiving yesterday's record.

---

## 7. Testing & Verification

1. **Unit Testing (`tests/bossBattleEngine.test.ts`):**
   - Verify `calculateBossMaxHp` across different player levels and goal configurations.
   - Verify damage calculations for pushups, gym sets, cardio, and HIIT.
   - Verify $+50\%$ damage bonus when activity matches `boss.weakness`.
   - Verify `executeApexStrikeDamage` formula, critical strike probabilities, and charge consumption.
   - Verify `generateBossLoot` output values and stat allocation.
2. **Quality & Performance:**
   - Full test run via `npm test`.
   - TypeScript verification via `npm run lint` (`tsc --noEmit`).
   - Production bundle build via `npm run build`.
   - Design check via `impeccable detect src`.
