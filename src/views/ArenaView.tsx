import React, { useState, useMemo, useRef } from 'react';
import {
  Trophy,
  Users,
  Award,
  Crown,
  Flame,
  Shield,
  Zap,
  ShoppingBag,
  Sparkles,
  Check,
  ChevronRight,
  ThumbsUp,
  Share2,
  TrendingUp,
  Search,
  ArrowUp,
  ArrowDown,
  Target,
  Medal,
  Globe,
  Filter,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { LeaderboardUser, RankTier } from '../types';
import { calculateCumulativeXp } from '../utils/fitnessCalculations';
import { sounds } from '../utils/soundEffects';

type MetricSort = 'totalXp' | 'streak' | 'weeklyXp';
type ScopeFilter = 'all' | 'friends';

export const ArenaView: React.FC = () => {
  const {
    leaderboard,
    achievements,
    shopItems,
    user,
    currentUser,
    setActiveAuthModal,
    sendHighFive,
    buyShopItem,
    claimAchievement,
    setShareModal,
  } = useFitness();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements' | 'shop'>('leaderboard');
  const [metricSort, setMetricSort] = useState<MetricSort>('totalXp');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'streak' | 'pushups'>('all');

  const userRowRef = useRef<HTMLDivElement | null>(null);

  // Compute live total XP for current user
  const userLiveTotalXp = useMemo(() => {
    return calculateCumulativeXp(user.level, user.xp);
  }, [user.level, user.xp]);

  // Merge leaderboard with live user data
  const normalizedLeaderboard = useMemo(() => {
    return leaderboard.map((player) => {
      if (player.isUser) {
        return {
          ...player,
          username: `${user.name} (You)`,
          avatar: user.avatar,
          level: user.level,
          title: user.title,
          totalXp: userLiveTotalXp,
          streak: user.currentStreak,
          league: user.rankTier,
        };
      }
      return {
        ...player,
        totalXp: player.totalXp ?? calculateCumulativeXp(player.level, player.weeklyXp),
      };
    });
  }, [leaderboard, user.name, user.avatar, user.level, user.title, user.currentStreak, user.rankTier, userLiveTotalXp]);

  // Sort and re-rank leaderboard dynamically based on active metric
  const rankedLeaderboard = useMemo(() => {
    // 1. Sort by selected metric
    const sorted = [...normalizedLeaderboard].sort((a, b) => {
      if (metricSort === 'totalXp') {
        return (b.totalXp ?? 0) - (a.totalXp ?? 0);
      }
      if (metricSort === 'streak') {
        if (b.streak !== a.streak) {
          return b.streak - a.streak;
        }
        return (b.totalXp ?? 0) - (a.totalXp ?? 0);
      }
      // weeklyXp
      return b.weeklyXp - a.weeklyXp;
    });

    // 2. Assign dynamic rank (1 to N)
    return sorted.map((player, idx) => ({
      ...player,
      dynamicRank: idx + 1,
    }));
  }, [normalizedLeaderboard, metricSort]);

  // Filter by scope, league, and search
  const filteredLeaderboard = useMemo(() => {
    return rankedLeaderboard.filter((player) => {
      // Scope filter (friends vs global)
      if (scopeFilter === 'friends' && !player.isFriend && !player.isUser) {
        return false;
      }
      // League tier filter
      if (selectedLeague !== 'All' && player.league !== selectedLeague) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = player.username.toLowerCase().includes(q);
        const matchesTitle = player.title.toLowerCase().includes(q);
        if (!matchesName && !matchesTitle) return false;
      }
      return true;
    });
  }, [rankedLeaderboard, scopeFilter, selectedLeague, searchQuery]);

  // Current user's standing and comparison metrics
  const userRankData = useMemo(() => {
    const userIndex = rankedLeaderboard.findIndex((p) => p.isUser);
    if (userIndex === -1) return null;

    const currentUserEntry = rankedLeaderboard[userIndex];
    const userRank = currentUserEntry.dynamicRank;
    const totalAthletes = rankedLeaderboard.length;
    const topLeader = rankedLeaderboard[0];
    const playerAbove = userIndex > 0 ? rankedLeaderboard[userIndex - 1] : null;

    // Gaps based on active metric
    let gapToLeader = 0;
    let gapToNextRank = 0;
    let metricUnit = 'XP';

    if (metricSort === 'totalXp') {
      gapToLeader = (topLeader.totalXp ?? 0) - (currentUserEntry.totalXp ?? 0);
      gapToNextRank = playerAbove ? (playerAbove.totalXp ?? 0) - (currentUserEntry.totalXp ?? 0) : 0;
      metricUnit = 'XP';
    } else if (metricSort === 'streak') {
      gapToLeader = topLeader.streak - currentUserEntry.streak;
      gapToNextRank = playerAbove ? playerAbove.streak - currentUserEntry.streak : 0;
      metricUnit = 'Days';
    } else {
      gapToLeader = topLeader.weeklyXp - currentUserEntry.weeklyXp;
      gapToNextRank = playerAbove ? playerAbove.weeklyXp - currentUserEntry.weeklyXp : 0;
      metricUnit = 'Weekly XP';
    }

    const percentile = Math.max(1, Math.round((userRank / totalAthletes) * 100));

    return {
      userRank,
      totalAthletes,
      currentUserEntry,
      topLeader,
      playerAbove,
      gapToLeader,
      gapToNextRank,
      metricUnit,
      percentile,
    };
  }, [rankedLeaderboard, metricSort]);

  // Jump scroll to user's row
  const handleScrollToUser = () => {
    sounds.playRepCount();
    if (userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const filteredAchievements = achievements.filter((a) => {
    if (achievementFilter === 'unlocked') return a.unlocked;
    if (achievementFilter === 'streak') return a.category === 'streak';
    if (achievementFilter === 'pushups') return a.category === 'pushups';
    return true;
  });

  // Top 3 Podium Players
  const podiumTop3 = useMemo(() => {
    const top1 = rankedLeaderboard[0];
    const top2 = rankedLeaderboard[1];
    const top3 = rankedLeaderboard[2];
    return { top1, top2, top3 };
  }, [rankedLeaderboard]);

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-black font-game text-white tracking-wide">
              ARENA: GLOBAL LEADERBOARD
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Compare streaks, total XP & ranks against athletes worldwide
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-2xl border border-amber-500/30 shadow-sm">
          <span>💎</span>
          <span>{user.gems} Gems</span>
        </div>
      </div>

      {/* Arena Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/10 text-xs">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'achievements'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Milestones</span>
        </button>

        <button
          onClick={() => setActiveTab('shop')}
          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Rewards</span>
        </button>
      </div>

      {/* 1. GLOBAL LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Optional unverified banner */}
          {!currentUser && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  🔥
                </div>
                <div>
                  <span className="font-bold text-white block">Unverified Warrior</span>
                  <span className="text-[10px] text-slate-400">Sign in with Firebase to lock in your rank on Cloud Firestore</span>
                </div>
              </div>
              <button
                onClick={() => setActiveAuthModal(true)}
                className="py-1 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow shrink-0"
              >
                <span>Login</span>
              </button>
            </div>
          )}

          {/* USER'S COMPARISON HUD / RANK COMPARISON CARD */}
          {userRankData && (
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 border-emerald-500/40 p-4 shadow-2xl overflow-hidden">
              {/* Shimmer light sweep */}
              <div className="absolute inset-0 pointer-events-none opacity-20 animate-shimmer" />

              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 font-black font-game text-[10px] px-1.5 rounded-full border border-black shadow">
                      LV{user.level}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{user.name}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        {user.rankTier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-300">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Rank #{userRankData.userRank}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">Top {userRankData.percentile}%</span>
                    </div>
                  </div>
                </div>

                {/* Jump to user row button */}
                <button
                  onClick={handleScrollToUser}
                  className="py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-game flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Locate Me</span>
                </button>
              </div>

              {/* Live Comparison Delta Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Comparison to #1 Leader */}
                <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Gap to #1 ({userRankData.topLeader.username.split(' ')[0]})
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    {userRankData.userRank === 1 ? (
                      <span className="text-sm font-black font-game text-amber-400">👑 YOU ARE #1!</span>
                    ) : (
                      <>
                        <span className="text-base font-black font-mono text-rose-400">
                          -{userRankData.gapToLeader.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">{userRankData.metricUnit}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Comparison to Next Rank Above */}
                <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-emerald-400" />
                    To Overtake #{Math.max(1, userRankData.userRank - 1)}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    {userRankData.userRank === 1 ? (
                      <span className="text-sm font-black font-game text-emerald-400">DEFENDING THRONE</span>
                    ) : (
                      <>
                        <span className="text-base font-black font-mono text-amber-400">
                          +{userRankData.gapToNextRank.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">{userRankData.metricUnit}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress to overtake next rank bar */}
              {userRankData.playerAbove && (
                <div className="mt-3 pt-2.5 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-teal-400" />
                      Climbing toward #{userRankData.playerAbove.dynamicRank} ({userRankData.playerAbove.username.split(' ')[0]})
                    </span>
                    <span className="text-amber-400 font-bold">
                      {metricSort === 'totalXp'
                        ? `${(userRankData.currentUserEntry.totalXp ?? 0).toLocaleString()} / ${(userRankData.playerAbove.totalXp ?? 0).toLocaleString()} XP`
                        : `${userRankData.currentUserEntry.streak} / ${userRankData.playerAbove.streak} Days`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 glow-emerald"
                      style={{
                        width: `${Math.min(
                          100,
                          metricSort === 'totalXp'
                            ? Math.round(
                                ((userRankData.currentUserEntry.totalXp ?? 0) /
                                  (userRankData.playerAbove.totalXp || 1)) *
                                  100
                              )
                            : Math.round(
                                (userRankData.currentUserEntry.streak /
                                  (userRankData.playerAbove.streak || 1)) *
                                  100
                              )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRIMARY METRIC TOGGLES: TOTAL XP vs USER STREAKS vs WEEKLY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-game font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                Rank Leaderboard By:
              </span>
              <button
                onClick={() => setShareModal(true)}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Share Rank</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-white/10 text-xs">
              <button
                onClick={() => {
                  sounds.playRepCount();
                  setMetricSort('totalXp');
                }}
                className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  metricSort === 'totalXp'
                    ? 'bg-amber-500 text-amber-950 font-black shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Total XP</span>
              </button>

              <button
                onClick={() => {
                  sounds.playStreakFlame();
                  setMetricSort('streak');
                }}
                className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  metricSort === 'streak'
                    ? 'bg-orange-500 text-orange-950 font-black shadow-md shadow-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>User Streaks</span>
              </button>

              <button
                onClick={() => {
                  sounds.playRepCount();
                  setMetricSort('weeklyXp');
                }}
                className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  metricSort === 'weeklyXp'
                    ? 'bg-emerald-500 text-emerald-950 font-black shadow-md shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Weekly XP</span>
              </button>
            </div>
          </div>

          {/* SCOPE & SEARCH FILTERS */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Search athlete or title"
                placeholder="Search athlete or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                  scopeFilter === 'all' ? 'bg-amber-500 text-amber-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setScopeFilter('friends')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
                  scopeFilter === 'friends' ? 'bg-amber-500 text-amber-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Friends
              </button>
            </div>
          </div>

          {/* PODIUM DISPLAY FOR TOP 3 ATHLETES */}
          {podiumTop3.top1 && !searchQuery && (
            <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-amber-500/30 p-4 shadow-xl">
              <div className="text-center mb-3">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  🏆 Podium Champions • {metricSort === 'totalXp' ? 'All-Time Total XP' : metricSort === 'streak' ? 'Longest Streaks' : 'Weekly Champions'}
                </span>
              </div>

              <div className="flex items-end justify-center gap-2 sm:gap-4 pt-2">
                {/* 2nd Place (Silver) */}
                {podiumTop3.top2 && (
                  <div className="flex-1 max-w-[105px] flex flex-col items-center">
                    <div className="relative mb-1.5">
                      <img
                        src={podiumTop3.top2.avatar}
                        alt={podiumTop3.top2.username}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-300 shadow-md"
                      />
                      <span className="absolute -top-2 -right-1 text-base">🥈</span>
                      <span className="absolute -bottom-1 -right-1 text-[9px] font-mono font-bold bg-slate-800 text-slate-200 px-1 rounded">
                        Lv{podiumTop3.top2.level}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-white truncate max-w-full text-center">
                      {podiumTop3.top2.username.split(' ')[0]}
                    </span>
                    <div className="text-[10px] font-mono text-slate-300 font-bold mt-0.5">
                      {metricSort === 'streak'
                        ? `${podiumTop3.top2.streak}d`
                        : `${(podiumTop3.top2.totalXp ?? 0).toLocaleString()} XP`}
                    </div>
                    <div className="w-full h-16 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-xl mt-2 flex items-center justify-center font-game font-black text-slate-300 text-sm border-t border-slate-400/40">
                      2ND
                    </div>
                  </div>
                )}

                {/* 1st Place (Gold / Crown) */}
                <div className="flex-1 max-w-[120px] flex flex-col items-center -mt-4">
                  <div className="relative mb-1.5">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-pulse">
                      <Crown className="w-5 h-5 text-amber-400" />
                    </div>
                    <img
                      src={podiumTop3.top1.avatar}
                      alt={podiumTop3.top1.username}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xl shadow-amber-500/20"
                    />
                    <span className="absolute -top-1 -right-1 text-lg">🥇</span>
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-mono font-bold bg-amber-500 text-amber-950 px-1 rounded">
                      Lv{podiumTop3.top1.level}
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-300 truncate max-w-full text-center">
                    {podiumTop3.top1.username.split(' ')[0]}
                  </span>
                  <div className="text-[11px] font-mono text-amber-400 font-black mt-0.5">
                    {metricSort === 'streak'
                      ? `${podiumTop3.top1.streak}d Streak`
                      : `${(podiumTop3.top1.totalXp ?? 0).toLocaleString()} Total XP`}
                  </div>
                  <div className="w-full h-22 bg-gradient-to-t from-amber-600/70 via-amber-500/60 to-yellow-400/60 rounded-t-xl mt-2 flex flex-col items-center justify-center font-game font-black text-amber-950 text-base border-t border-amber-300/60 shadow-lg shadow-amber-500/20">
                    <span>1ST</span>
                    <span className="text-[9px] font-mono font-bold opacity-80">APEX LEADER</span>
                  </div>
                </div>

                {/* 3rd Place (Bronze) */}
                {podiumTop3.top3 && (
                  <div className="flex-1 max-w-[105px] flex flex-col items-center">
                    <div className="relative mb-1.5">
                      <img
                        src={podiumTop3.top3.avatar}
                        alt={podiumTop3.top3.username}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-700 shadow-md"
                      />
                      <span className="absolute -top-2 -right-1 text-base">🥉</span>
                      <span className="absolute -bottom-1 -right-1 text-[9px] font-mono font-bold bg-slate-800 text-amber-600 px-1 rounded">
                        Lv{podiumTop3.top3.level}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-white truncate max-w-full text-center">
                      {podiumTop3.top3.username.split(' ')[0]}
                    </span>
                    <div className="text-[10px] font-mono text-amber-500 font-bold mt-0.5">
                      {metricSort === 'streak'
                        ? `${podiumTop3.top3.streak}d`
                        : `${(podiumTop3.top3.totalXp ?? 0).toLocaleString()} XP`}
                    </div>
                    <div className="w-full h-12 bg-gradient-to-t from-amber-950 to-amber-900/80 rounded-t-xl mt-2 flex items-center justify-center font-game font-black text-amber-500 text-sm border-t border-amber-700/40">
                      3RD
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ATHLETES LEADERBOARD TABLE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
              <span>ATHLETE & RANK</span>
              <span className="flex items-center gap-4">
                <span>STREAK</span>
                <span>TOTAL XP</span>
              </span>
            </div>

            {filteredLeaderboard.map((player) => {
              const isCurrentUser = player.isUser;
              const userDelta = userRankData
                ? (player.totalXp ?? 0) - (userRankData.currentUserEntry.totalXp ?? 0)
                : 0;

              return (
                <div
                  key={player.id}
                  ref={isCurrentUser ? userRowRef : undefined}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40'
                      : 'bg-slate-900/85 border-white/5 hover:bg-slate-800/80 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Rank Badge & Athlete Profile */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank number or medal */}
                      <div className="w-7 text-center font-game font-black text-sm shrink-0">
                        {player.dynamicRank === 1 ? (
                          <span className="text-amber-400 text-base">🥇</span>
                        ) : player.dynamicRank === 2 ? (
                          <span className="text-slate-300 text-base">🥈</span>
                        ) : player.dynamicRank === 3 ? (
                          <span className="text-amber-600 text-base">🥉</span>
                        ) : (
                          <span className={isCurrentUser ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            #{player.dynamicRank}
                          </span>
                        )}
                      </div>

                      {/* Avatar with level badge */}
                      <div className="relative shrink-0">
                        <img
                          src={player.avatar}
                          alt={player.username}
                          className={`w-10 h-10 rounded-xl object-cover border ${
                            isCurrentUser ? 'border-emerald-400' : 'border-white/10'
                          }`}
                        />
                        <span className="absolute -bottom-1 -right-1 text-[8px] font-bold font-mono px-1 rounded bg-slate-950 border border-white/15 text-emerald-400">
                          Lv{player.level}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-white truncate max-w-[130px] sm:max-w-[180px]">
                            {player.username}
                          </h4>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black font-game px-1.5 py-0.2 rounded bg-emerald-500 text-emerald-950">
                              YOU
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span className="text-emerald-400 font-medium truncate max-w-[110px]">
                            {player.title}
                          </span>
                          <span>•</span>
                          <span className="text-amber-400 font-semibold">{player.league}</span>
                        </div>
                      </div>
                    </div>

                    {/* Streak & Total XP metrics */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Streak Column */}
                      <div className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-slate-950/70 border border-white/5 min-w-[52px]">
                        <div className="flex items-center gap-1 text-amber-400 font-black font-mono text-xs">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          <span>{player.streak}d</span>
                        </div>
                        <span className="text-[8px] text-slate-500 font-mono uppercase">Streak</span>
                      </div>

                      {/* Total XP Column */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-xs font-black font-mono text-white flex items-center justify-end gap-1">
                          <Zap className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          <span>{(player.totalXp ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {isCurrentUser ? (
                            <span className="text-emerald-400 font-bold">Current Standing</span>
                          ) : userDelta > 0 ? (
                            <span className="text-emerald-400 font-medium">+{userDelta.toLocaleString()} ahead</span>
                          ) : (
                            <span className="text-rose-400 font-medium">{userDelta.toLocaleString()} behind</span>
                          )}
                        </div>
                      </div>

                      {/* Social High-Five Action */}
                      {!isCurrentUser ? (
                        <button
                          onClick={() => sendHighFive(player.id)}
                          disabled={player.hasHighFivedToday}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            player.hasHighFivedToday
                              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 active:scale-95'
                          }`}
                          title="Send high-five / fist-bump (+25 XP)"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="font-mono text-[10px]">{player.highFivesReceived}</span>
                        </button>
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ACHIEVEMENTS & MILESTONES TAB */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {/* Progress Overview Card */}
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-4 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase font-game">
                Hall of Fame Mastery
              </span>
              <div className="text-2xl font-black font-game text-white mt-0.5">
                {unlockedCount} / {achievements.length} <span className="text-xs font-normal text-slate-400">Unlocked</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">
                Unlock milestones to climb the Global Arena Leaderboard
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
              🏅
            </div>
          </div>

          {/* Achievement Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pb-1">
            {[
              { id: 'all', label: 'All Badges' },
              { id: 'unlocked', label: 'Completed' },
              { id: 'streak', label: 'Habit Streaks' },
              { id: 'pushups', label: 'Gym & Pushups' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setAchievementFilter(f.id as typeof achievementFilter)}
                className={`px-3 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer ${
                  achievementFilter === f.id
                    ? 'bg-emerald-500 text-emerald-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAchievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  ach.unlocked
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      ach.unlocked
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 font-black shadow-md'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ach.category === 'streak' ? '🔥' : ach.category === 'pushups' ? '💪' : '🏆'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-white truncate">{ach.title}</h4>
                      <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                        +{ach.xpReward} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className={ach.unlocked ? 'text-emerald-400 font-bold' : ''}>
                        {ach.progress} / {ach.maxProgress}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          ach.unlocked ? 'bg-emerald-400' : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. GEM REWARDS & BUFF SHOP TAB */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/30 p-4 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Gem Bounty Vault</span>
              <h3 className="font-game font-bold text-white text-base mt-0.5">Arena Buff & Shields Shop</h3>
              <p className="text-[11px] text-slate-400">Buy streak freezes and exclusive RPG rank titles</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Available</span>
              <span className="text-xl font-black font-mono text-amber-400">{user.gems} 💎</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shopItems.map((item) => {
              const canAfford = user.gems >= item.costGems;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl shrink-0">
                      {item.category === 'shield' ? '🛡️' : '👑'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{item.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => buyShopItem(item.id)}
                    disabled={!canAfford}
                    className={`py-1.5 px-3 rounded-xl font-bold font-game text-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 font-black active:scale-95 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{item.costGems}</span>
                    <span>💎</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
