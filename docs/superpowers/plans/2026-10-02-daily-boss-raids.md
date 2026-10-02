# Daily Boss Raids & Dungeon Encounters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Daily Boss Raids & Dungeon Encounter system where real workouts and steps passively damage an adaptive daily Titan, players unleash active Apex Strikes in a combat modal, and defeating the boss yields a multi-tier Slayer's Victory Chest.

**Architecture:** Pure TypeScript calculation engine with unit tests (`bossBattleEngine.ts`), integrated into `FitnessContext` state with offline `localStorage` and Firestore synchronization, rendered via accessible React modal dialogs (`BossBattleModal`, `VictoryChestModal`) and responsive banner cards (`BossRaidBannerCard`) across Dashboard and Workout views.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React icons, Canvas Confetti, Web Audio API (`soundEffects.ts`), Node.js test runner (`tsx --test`).

**Spec:** [`docs/superpowers/specs/2026-10-02-daily-boss-raids-design.md`](file:///c:/Users/Kallol%20Bera/Downloads/apexquest-fitness_-rpg-tracker/docs/superpowers/specs/2026-10-02-daily-boss-raids-design.md)

## Global Constraints
- Target Node/TypeScript compatibility: Node 20+, Strict TypeScript with zero errors on `tsc --noEmit`.
- No new external runtime dependencies; use existing `canvas-confetti` and `lucide-react`.
- All modals must adhere to WCAG 2.1 AA dialog pattern via `useDialogAccessibility` with <kbd>Escape</kbd> dismissal and accessible labels.
- Calculations must maintain purity for deterministic unit testing.

## Review Focus
1. **Midnight Rollover:** A player opening the app on a new day must receive the new day's boss with fresh adaptive HP rather than carrying over yesterday's state.
2. **Negative / Zero HP Boundaries:** Once current HP drops to 0, it must clamp to 0 and immediately mark `isDefeated = true` without negative numbers or infinite damage loops.
3. **Double Chest Claiming Prevention:** Tapping "Claim Loot" must be idempotent and set `chestClaimed: true` to prevent duplicate gem/stat exploits.
4. **Apex Charge Overflow & Underflow:** Apex Strike charge must clamp strictly between 0% and 100%, and require $\ge 50\%$ charge to execute.
5. **No Workouts Logged:** On days with zero logged workouts, the Boss Arena should cleanly display full HP, 0% charge, and helpful prompt cues to start training.

---

### Task 1: Boss Data Models & 7-Day Roster Definitions

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/data/bossData.ts`

**Interfaces:**
- Produces: `BossDefinition`, `DailyBossState`, `BossLootDrop`, `bossRoster: BossDefinition[]`, `getBossForDate(dateStr: string): BossDefinition`

- [ ] **Step 1: Add Boss types to `src/types/index.ts`**
Add `BossDefinition`, `DailyBossState`, and `BossLootDrop` interfaces matching the spec.

- [ ] **Step 2: Create `src/data/bossData.ts`**
Implement the 7-day thematic roster (Ironclad Goliath, Zephyr Storm Drake, Obsidian Colossus, Ignis Pyre Behemoth, Venomfang Wyrm, Frost Dreadnought, Apex Shadow Overlord) with elemental affinities, icons, weaknesses, and helper `getBossForDate`.

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npm run lint`
Expected: PASS (0 errors)

---

### Task 2: Combat Calculations & Loot Engine (TDD)

**Files:**
- Create: `tests/bossBattleEngine.test.ts`
- Create: `src/utils/bossBattleEngine.ts`

**Interfaces:**
- Consumes: `BossDefinition`, `DailyBossState`, `UserStats`
- Produces:
  - `calculateBossMaxHp(user: UserStats): number`
  - `calculateActivityDamage(activity: WorkoutLogEntry | { category: ActivityCategory; reps?: number; steps?: number; durationMinutes?: number; caloriesBurned?: number }, boss: BossDefinition, user: UserStats): { damage: number; isCrit: boolean; weaknessBonus: boolean }`
  - `executeApexStrikeDamage(boss: BossDefinition, user: UserStats): { damage: number; isCrit: boolean }`
  - `generateBossLoot(boss: BossDefinition, user: UserStats): BossLootDrop`

- [ ] **Step 1: Write the failing tests in `tests/bossBattleEngine.test.ts`**
Cover adaptive HP scaling, pushup damage, gym volume damage, cardio/step damage, elemental weakness bonus ($+50\%$), Apex Strike critical multiplier, and loot generation.

- [ ] **Step 2: Run test to verify failure**
Run: `node --import tsx --test tests/bossBattleEngine.test.ts`
Expected: FAIL ("Cannot find module '../src/utils/bossBattleEngine'")

- [ ] **Step 3: Implement `src/utils/bossBattleEngine.ts`**
Implement the pure calculation functions according to the exact mathematical formulas in Section 2 of the spec.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --import tsx --test tests/bossBattleEngine.test.ts`
Expected: PASS (All test assertions pass)

---

### Task 3: FitnessContext Integration & Persistence

**Files:**
- Modify: `src/context/FitnessContext.tsx`

**Interfaces:**
- Consumes: `bossBattleEngine.ts`, `bossData.ts`
- Produces:
  - State: `dailyBossState`, `activeBoss`, `isBossModalOpen`, `isChestModalOpen`
  - Actions: `executeApexStrike()`, `claimBossLoot()`, `setIsBossModalOpen()`, `setIsChestModalOpen()`
  - Auto-damage on `addWorkout`, `logPushupSet`, and step changes.

- [ ] **Step 1: Add Boss state & actions to `FitnessContextType` in `src/context/FitnessContext.tsx`**
Declare `dailyBossState`, `activeBoss`, `isBossModalOpen`, `isChestModalOpen`, `executeApexStrike`, and `claimBossLoot`.

- [ ] **Step 2: Implement state initialization & rollover in `FitnessContext.tsx`**
Initialize from `localStorage` under `apexquest_daily_boss_state`. If cached date does not match `todayDate`, roll over to a fresh daily boss.

- [ ] **Step 3: Hook into `addWorkout` and pushup logging**
Automatically call `calculateActivityDamage` when workouts or pushups are logged, deduct from `dailyBossState.currentHp`, update `damageLog`, and increment `apexChargePercent`.

- [ ] **Step 4: Implement `executeApexStrike` and `claimBossLoot`**
`executeApexStrike` deducts 50% charge, deals burst damage with SFX, and triggers defeat when HP reaches 0. `claimBossLoot` adds gems, XP, stat points, and streak shields to `user`.

- [ ] **Step 5: Verify build & lint**
Run: `npm run lint; npm test`
Expected: PASS with 0 errors.

---

### Task 4: Interactive UI Components

**Files:**
- Create: `src/components/BossRaidBannerCard.tsx`
- Create: `src/components/BossBattleModal.tsx`
- Create: `src/components/VictoryChestModal.tsx`

**Interfaces:**
- Consumes: `useFitness()`, `useDialogAccessibility()`
- Produces:
  - `BossRaidBannerCard`: Responsive glowing card with HP bar, weakness pill, and battle trigger.
  - `BossBattleModal`: Animated boss arena with strike button, damage floaters, hit reacts, and combat log.
  - `VictoryChestModal`: Tap-to-unlock 3D-styled chest with confetti and multi-tier loot cards.

- [ ] **Step 1: Build `BossRaidBannerCard.tsx`**
Include boss avatar, element badge, weakness info, animated HP progress bar, and "BATTLE RAID" trigger button.

- [ ] **Step 2: Build `BossBattleModal.tsx`**
Implement the combat arena with `useDialogAccessibility`, boss avatar with screen shake on strike, floating combat text (`-340 CRIT!`), live combat log feed, and "⚡ ENGAGE APEX STRIKE" button.

- [ ] **Step 3: Build `VictoryChestModal.tsx`**
Implement golden chest container, click-to-unlock sequence with `confetti()`, loot card reveals (Gems, XP, Stat Point, Streak Shield, Slayer Title), and "Claim Rewards" action.

- [ ] **Step 4: Verify TypeScript compilation**
Run: `npm run lint`
Expected: PASS (0 errors)

---

### Task 5: View Integration & End-to-End Verification

**Files:**
- Modify: `src/views/DashboardView.tsx`
- Modify: `src/views/WorkoutView.tsx`
- Modify: `src/App.tsx` (mount modals if needed or inside AndroidFrame)

- [ ] **Step 1: Mount `BossRaidBannerCard` in `DashboardView.tsx`**
Place directly below the warrior status header and above Daily Quests.

- [ ] **Step 2: Mount `BossRaidBannerCard` in `WorkoutView.tsx`**
Place at the top of the War Room above quick pushup logging.

- [ ] **Step 3: Mount `BossBattleModal` and `VictoryChestModal` in `App.tsx`**
Ensure modals are accessible globally whenever opened from either view.

- [ ] **Step 4: Execute Full Verification Suite**
Run: `npm test; npm run build; npm run lint`
Expected:
- `npm test`: 100% pass (calculators + boss battle engine)
- `npm run lint`: 0 TypeScript errors
- `npm run build`: Vite build completed cleanly in <1s
- Impeccable detect: 0 blocking issues
