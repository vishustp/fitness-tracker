import React, { useState } from 'react';
import { AndroidStatusBar } from './AndroidStatusBar';
import { AndroidBottomNav, TabType } from './AndroidBottomNav';
import { AndroidPushBanner } from './AndroidPushBanner';
import { LevelUpModal } from './LevelUpModal';
import { AchievementUnlockedToast } from './AchievementUnlockedToast';
import { SocialShareModal } from './SocialShareModal';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import { QuickLogSheet } from './QuickLogSheet';
import { FirebaseLoginModal } from './FirebaseLoginModal';
import { BossBattleModal } from './BossBattleModal';
import { VictoryChestModal } from './VictoryChestModal';
import { useFitness } from '../context/FitnessContext';

interface AndroidFrameProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);

  return (
    <div className="min-h-screen w-full bg-[#04070e] text-slate-100 flex items-center justify-center p-0 md:p-6 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main container: either mobile chassis or responsive fullscreen */}
      <div
        className={`relative transition-all duration-300 w-full ${
          isFrameMode
            ? 'max-w-[440px] h-screen sm:h-[92vh] max-h-none sm:max-h-[920px] rounded-none sm:rounded-[48px] border-0 sm:border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_2px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col bg-[#070b14]'
            : 'max-w-4xl h-screen md:h-[95vh] rounded-none md:rounded-3xl border-0 md:border md:border-white/10 shadow-2xl flex flex-col bg-[#070b14] overflow-hidden'
        }`}
      >
        {/* Android Physical side button accents in frame mode (shown on desktop/tablet) */}
        {isFrameMode && (
          <div className="hidden sm:block">
            <div className="absolute -left-[14px] top-28 w-[4px] h-12 bg-slate-700 rounded-l-md pointer-events-none" />
            <div className="absolute -left-[14px] top-44 w-[4px] h-12 bg-slate-700 rounded-l-md pointer-events-none" />
            <div className="absolute -right-[14px] top-36 w-[4px] h-16 bg-slate-700 rounded-r-md pointer-events-none" />
          </div>
        )}

        {/* Android Status Bar */}
        <AndroidStatusBar
          isFrameMode={isFrameMode}
          onToggleFrameMode={() => setIsFrameMode((prev) => !prev)}
        />

        {/* Top Push Notification Banner listener */}
        <AndroidPushBanner />

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative overscroll-contain">
          {children}
        </main>

        {/* Android Bottom Navigation */}
        <AndroidBottomNav activeTab={activeTab} onTabChange={onTabChange} />

        {/* Global Overlays & Modals */}
        <LevelUpModal />
        <AchievementUnlockedToast />
        <SocialShareModal />
        <NotificationSettingsModal />
        <QuickLogSheet />
        <FirebaseLoginModal />
        <BossBattleModal />
        <VictoryChestModal />
      </div>
    </div>
  );
};
