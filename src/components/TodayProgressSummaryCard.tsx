import React, { useState, useMemo } from 'react';
import {
  Share2,
  Copy,
  Check,
  Flame,
  Footprints,
  Zap,
  Droplet,
  Crown,
  Dumbbell,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  Sliders,
  ExternalLink,
  MessageCircle,
  Twitter,
  Image as ImageIcon,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import {
  calculateBMR,
  calculateNetCalories,
  calculateStepCalories,
} from '../utils/fitnessCalculations';
import { sounds } from '../utils/soundEffects';

type SummaryTone = 'warrior' | 'stats' | 'social';

export const TodayProgressSummaryCard: React.FC = () => {
  const { user, todayActivity, dailyQuests, setShareModal } = useFitness();

  const [tone, setTone] = useState<SummaryTone>('warrior');
  const [copied, setCopied] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [includePushups, setIncludePushups] = useState(true);
  const [includeWater, setIncludeWater] = useState(true);
  const [includeNetCal, setIncludeNetCal] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Caloric calculations
  const bmr = calculateBMR(user.weightKg, user.heightCm, user.age, user.gender);
  const foodCal = todayActivity.meals.reduce((sum, m) => sum + m.calories, 0);
  const workoutCal = todayActivity.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const stepCal = calculateStepCalories(todayActivity.steps, user.weightKg);
  const netStats = calculateNetCalories(foodCal, bmr, workoutCal, stepCal);

  const stepPercent = Math.min(100, Math.round((todayActivity.steps / user.dailyGoalSteps) * 100));
  const burnPercent = Math.min(100, Math.round((todayActivity.caloriesBurned / user.dailyGoalCaloriesBurn) * 100));
  const waterPercent = Math.min(100, Math.round((todayActivity.waterMl / user.dailyGoalWaterMl) * 100));

  const totalPushupsToday = todayActivity.workouts
    .filter((w) => w.pushupReps)
    .reduce((sum, w) => sum + (w.pushupReps || 0), 0);

  const claimedQuests = dailyQuests.filter((q) => q.claimed).length;

  // Total XP gained today from workouts + claimed quests
  const workoutXpToday = todayActivity.workouts.reduce((sum, w) => sum + w.xpGained, 0);
  const questXpToday = dailyQuests
    .filter((q) => q.claimed)
    .reduce((sum, q) => sum + q.xpReward, 0);
  const totalXpEarnedToday = workoutXpToday + questXpToday;

  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Formatted summary text generated dynamically based on selected tone
  const summaryText = useMemo(() => {
    if (tone === 'warrior') {
      let text = `⚔️ YODHA FITNESS • DAILY BATTLE REPORT\n`;
      text += `📅 Date: ${todayDateStr}\n`;
      text += `🛡️ Warrior: ${user.name} | Level ${user.level} ${user.title} (${user.rankTier})\n`;
      text += `🔥 Streak: ${user.currentStreak} Days Conquered\n\n`;
      text += `🏆 TODAY'S VALIANT FEATS:\n`;
      text += `👟 Steps Marched: ${todayActivity.steps.toLocaleString()} / ${user.dailyGoalSteps.toLocaleString()} (${stepPercent}%)\n`;
      text += `🔥 Active Energy Felled: ${todayActivity.caloriesBurned} kcal (${burnPercent}%)\n`;
      if (includePushups && totalPushupsToday > 0) {
        text += `💪 Pushup Trials: ${totalPushupsToday} reps finished\n`;
      }
      if (includeNetCal) {
        text += `⚖️ Net Caloric Balance: ${netStats.net > 0 ? `+${netStats.net}` : netStats.net} kcal (${netStats.status.toUpperCase()})\n`;
      }
      if (includeWater) {
        text += `💧 Hydration Reserve: ${todayActivity.waterMl} / ${user.dailyGoalWaterMl} ml (${waterPercent}%)\n`;
      }
      text += `🎯 Quests Cleared: ${claimedQuests} / ${dailyQuests.length}\n`;
      text += `⚡ Total XP Harvested: +${totalXpEarnedToday} XP\n\n`;
      text += `⚔️ Awaken Your Inner Warrior with Yodha Fitness!`;
      if (includeHashtags) {
        text += `\n#YodhaFitness #WarriorMindset #FitnessRPG #DailyStreak`;
      }
      return text;
    }

    if (tone === 'stats') {
      let text = `📊 YODHA FITNESS SUMMARY • ${todayDateStr}\n`;
      text += `Athlete: ${user.name} • Level ${user.level} (${user.rankTier})\n`;
      text += `🔥 Streak: ${user.currentStreak} days\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `• Steps: ${todayActivity.steps.toLocaleString()} / ${user.dailyGoalSteps.toLocaleString()} (${stepPercent}%)\n`;
      text += `• Active Burn: ${todayActivity.caloriesBurned} kcal / ${user.dailyGoalCaloriesBurn} kcal\n`;
      text += `• Workouts Logged: ${todayActivity.workouts.length}\n`;
      if (includePushups && totalPushupsToday > 0) {
        text += `• Pushups: ${totalPushupsToday} reps\n`;
      }
      if (includeNetCal) {
        text += `• Net Calories: ${netStats.net > 0 ? `+${netStats.net}` : netStats.net} kcal (Food: ${foodCal} - Burn: ${workoutCal + stepCal + bmr})\n`;
      }
      if (includeWater) {
        text += `• Water Intake: ${todayActivity.waterMl} ml / ${user.dailyGoalWaterMl} ml\n`;
      }
      text += `• Quests: ${claimedQuests} of ${dailyQuests.length} completed\n`;
      text += `• XP Today: +${totalXpEarnedToday} XP\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `Track progress on Yodha Fitness Android RPG`;
      return text;
    }

    // Social Flex tone
    let text = `🔥 Day ${user.currentStreak} of staying relentless on Yodha Fitness!\n\n`;
    text += `👟 ${todayActivity.steps.toLocaleString()} steps crushed (${stepPercent}% of goal)\n`;
    text += `🔥 ${todayActivity.caloriesBurned} active kcal burned\n`;
    if (includePushups && totalPushupsToday > 0) {
      text += `💪 ${totalPushupsToday} pushups conquered\n`;
    }
    if (includeWater) {
      text += `💧 ${todayActivity.waterMl}ml water logged\n`;
    }
    text += `⚡ Level ${user.level} ${user.title}\n`;
    text += `🎯 ${claimedQuests}/${dailyQuests.length} daily quests locked in\n\n`;
    text += `Who's keeping up with this streak? ⚔️`;
    if (includeHashtags) {
      text += `\n#YodhaFitness #FitnessJourney #StreakOn #FitRPG #NoExcuses`;
    }
    return text;
  }, [
    tone,
    todayDateStr,
    user.name,
    user.level,
    user.title,
    user.rankTier,
    user.currentStreak,
    user.dailyGoalSteps,
    user.dailyGoalCaloriesBurn,
    user.dailyGoalWaterMl,
    todayActivity.steps,
    todayActivity.caloriesBurned,
    todayActivity.workouts.length,
    todayActivity.waterMl,
    stepPercent,
    burnPercent,
    waterPercent,
    includePushups,
    totalPushupsToday,
    includeNetCal,
    netStats.net,
    netStats.status,
    foodCal,
    workoutCal,
    stepCal,
    bmr,
    includeWater,
    claimedQuests,
    dailyQuests.length,
    totalXpEarnedToday,
    includeHashtags,
  ]);

  // Copy to clipboard handler
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      sounds.playRepCount();
      setShareFeedback('Summary copied to clipboard! 📋✨');
      setTimeout(() => {
        setCopied(false);
        setShareFeedback(null);
      }, 3000);
    } catch {
      // Fallback
      setShareFeedback('Unable to copy automatically');
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  // Trigger native share intent
  const handleTriggerShareIntent = async () => {
    sounds.playStreakFlame();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Yodha Fitness: Level ${user.level} Daily Summary`,
          text: summaryText,
          url: window.location.href,
        });
        setShareFeedback('Shared successfully! ⚔️');
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User closed share sheet, no error notification needed
          return;
        }
        // Fallback to clipboard
        await handleCopyToClipboard();
      }
    } else {
      // Fallback when navigator.share is unavailable
      await handleCopyToClipboard();
      setShareFeedback('Native share not supported on this device. Summary copied! 📋');
      setTimeout(() => setShareFeedback(null), 3500);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 p-4 shadow-xl relative overflow-hidden">
      {/* Decorative ambient background aura */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-game font-bold text-white text-sm">Today's Progress Summary</h3>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Share intent card & instant clipboard generator</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              showOptions
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Customize summary"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowTextPreview(!showTextPreview)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              showTextPreview
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle text view"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Temporary feedback banner */}
      {shareFeedback && (
        <div className="mb-3 py-1.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{shareFeedback}</span>
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Tone Switcher Pills */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-white/5 mb-3 text-xs">
        <button
          onClick={() => setTone('warrior')}
          className={`py-1.5 px-2 rounded-xl font-game font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
            tone === 'warrior'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>⚔️</span>
          <span>Warrior</span>
        </button>
        <button
          onClick={() => setTone('stats')}
          className={`py-1.5 px-2 rounded-xl font-game font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
            tone === 'stats'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>📊</span>
          <span>Stats Sheet</span>
        </button>
        <button
          onClick={() => setTone('social')}
          className={`py-1.5 px-2 rounded-xl font-game font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
            tone === 'social'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🚀</span>
          <span>Social Flex</span>
        </button>
      </div>

      {/* Customization Options Drawer */}
      {showOptions && (
        <div className="mb-3 p-3 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 text-xs animate-fadeIn">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Customize Summary Output
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={includePushups}
                onChange={(e) => setIncludePushups(e.target.checked)}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span>Include Pushups ({totalPushupsToday})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={includeNetCal}
                onChange={(e) => setIncludeNetCal(e.target.checked)}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span>Net Calorie Balance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={includeWater}
                onChange={(e) => setIncludeWater(e.target.checked)}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span>Include Water ml</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={includeHashtags}
                onChange={(e) => setIncludeHashtags(e.target.checked)}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span>Include #Hashtags</span>
            </label>
          </div>
        </div>
      )}

      {/* Visual Summary Card Presentation */}
      {!showTextPreview ? (
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 relative overflow-hidden mb-3">
          {/* Card Mini Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-xl object-cover border border-emerald-500/50"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-white">{user.name}</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                    LV{user.level}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{todayDateStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-game text-[11px] font-bold">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{user.currentStreak}d Streak</span>
            </div>
          </div>

          {/* Metric Tiles Grid */}
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1 text-[10px] text-teal-400 font-mono">
                <Footprints className="w-3 h-3" />
                <span>Steps</span>
              </div>
              <div className="font-mono font-black text-sm text-white mt-0.5">
                {todayActivity.steps.toLocaleString()}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">{stepPercent}% of goal</div>
            </div>

            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
                <Zap className="w-3 h-3" />
                <span>Burn</span>
              </div>
              <div className="font-mono font-black text-sm text-white mt-0.5">
                {todayActivity.caloriesBurned} <span className="text-[9px] font-normal text-slate-400">kcal</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">{burnPercent}% of goal</div>
            </div>

            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                <Sparkles className="w-3 h-3" />
                <span>XP Earned</span>
              </div>
              <div className="font-mono font-black text-sm text-amber-300 mt-0.5">
                +{totalXpEarnedToday}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">{claimedQuests} quests</div>
            </div>
          </div>

          {/* Secondary stats row */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-1">
              <Droplet className="w-3 h-3 text-blue-400" />
              <span>{todayActivity.waterMl}ml water</span>
            </span>
            {totalPushupsToday > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Dumbbell className="w-3 h-3" />
                <span>{totalPushupsToday} pushups</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-cyan-300">
              <span>⚖️</span>
              <span>{netStats.net > 0 ? `+${netStats.net}` : netStats.net} net</span>
            </span>
          </div>
        </div>
      ) : (
        /* Raw Text Preview */
        <div className="relative mb-3">
          <textarea
            readOnly
            value={summaryText}
            rows={7}
            className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-200 resize-none focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      )}

      {/* Main Action Buttons: Share Intent & Copy to Clipboard */}
      <div className="grid grid-cols-2 gap-2 mb-2.5">
        {/* Trigger Native Share Intent */}
        <button
          onClick={handleTriggerShareIntent}
          className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-game text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Progress</span>
        </button>

        {/* Copy to Clipboard */}
        <button
          onClick={handleCopyToClipboard}
          className={`py-2.5 px-3 rounded-2xl font-bold font-game text-xs flex items-center justify-center gap-2 cursor-pointer border transition-all active:scale-98 ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'bg-slate-950/80 hover:bg-slate-800 border-white/10 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 animate-scaleIn" />
              <span>Copied! 📋</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Copy Summary</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Third-Party Sharing Channels & High-Res Graphic Poster trigger */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono">Quick:</span>
          {/* WhatsApp Direct */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-emerald-400 text-slate-400 transition-colors"
            title="Share to WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
          {/* X / Twitter Direct */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(summaryText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-cyan-400 text-slate-400 transition-colors"
            title="Share to X"
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* High-Res Graphic Poster trigger */}
        <button
          onClick={() => setShareModal(true)}
          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Visual Poster Card</span>
        </button>
      </div>
    </div>
  );
};
