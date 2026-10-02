/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FitnessProvider } from './context/FitnessContext';
import { AndroidFrame } from './components/AndroidFrame';
import { TabType } from './components/AndroidBottomNav';
import { DashboardView } from './views/DashboardView';
import { WorkoutView } from './views/WorkoutView';
import { NutritionView } from './views/NutritionView';
import { CodexView } from './views/CodexView';
import { ArenaView } from './views/ArenaView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('quest');

  return (
    <FitnessProvider>
      <AndroidFrame activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'quest' && <DashboardView onNavigateTab={setActiveTab} />}
        {activeTab === 'battle' && <WorkoutView />}
        {activeTab === 'fuel' && <NutritionView />}
        {activeTab === 'codex' && <CodexView />}
        {activeTab === 'arena' && <ArenaView />}
      </AndroidFrame>
    </FitnessProvider>
  );
}
