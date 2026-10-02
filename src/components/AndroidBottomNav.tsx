import React from 'react';
import {
  Compass,
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
  Trophy,
  Plus,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';

export type TabType = 'quest' | 'battle' | 'fuel' | 'codex' | 'arena';

interface AndroidBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { setActiveQuickLogModal, user } = useFitness();

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'quest', label: 'Quest', icon: Compass },
    { id: 'battle', label: 'Workouts', icon: Dumbbell },
    { id: 'fuel', label: 'Fuel/Net', icon: UtensilsCrossed },
    { id: 'codex', label: 'History', icon: BarChart3 },
    { id: 'arena', label: 'Arena', icon: Trophy },
  ];

  return (
    <div className="relative w-full bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 select-none z-30">
      {/* Floating Center Quick-Action Button */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setActiveQuickLogModal('pushups')}
          aria-label="Quick Log Workout or Pushups"
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all group flex items-center justify-center cursor-pointer min-h-[48px] min-w-[48px]"
          title="Quick Log Workout or Pushups"
        >
          <div className="w-full h-full rounded-full bg-black/20 flex items-center justify-center text-black font-black">
            <Plus className="w-7 h-7 text-black stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
          </div>
        </button>
      </div>

      <div className="flex items-center justify-around max-w-lg mx-auto" role="navigation" aria-label="Main Navigation">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          // Space for the center floating button
          if (idx === 2) {
            return (
              <React.Fragment key={tab.id}>
                {/* Center placeholder space */}
                <div className="w-12 h-8" aria-hidden="true" />
                <button
                  onClick={() => onTabChange(tab.id)}
                  aria-label={`${tab.label} screen`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[48px] ${
                    isActive
                      ? 'text-emerald-400 scale-105'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`p-1 rounded-xl transition-colors ${
                      isActive ? 'bg-emerald-500/15' : 'bg-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight ${
                      isActive ? 'font-bold text-emerald-400' : 'font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              </React.Fragment>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={`${tab.label} screen`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[48px] ${
                isActive
                  ? 'text-emerald-400 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors relative ${
                  isActive ? 'bg-emerald-500/15' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                {tab.id === 'arena' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-emerald-400' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Android navigation pill indicator */}
      <div className="w-28 h-1 rounded-full bg-slate-700 mx-auto mt-2 opacity-50" />
    </div>
  );
};
