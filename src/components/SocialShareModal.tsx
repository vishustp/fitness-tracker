import React, { useRef, useState } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Flame,
  Footprints,
  Dumbbell,
  Crown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { calculateBMR, calculateNetCalories, calculateStepCalories } from '../utils/fitnessCalculations';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export const SocialShareModal: React.FC = () => {
  const { activeShareModal, setShareModal, user, todayActivity } = useFitness();
  const [copied, setCopied] = useState(false);
  const [cardTheme, setCardTheme] = useState<'emerald' | 'violet' | 'amber'>('emerald');
  const cardRef = useRef<HTMLDivElement>(null);

  const { dialogRef } = useDialogAccessibility({
    isOpen: Boolean(activeShareModal),
    onClose: () => setShareModal(false),
  });

  if (!activeShareModal) return null;

  const totalPushupsToday = todayActivity.workouts
    .filter((w) => w.pushupReps)
    .reduce((sum, w) => sum + (w.pushupReps || 0), 0);

  const bmr = calculateBMR(user.weightKg, user.heightCm, user.age, user.gender);
  const foodCal = todayActivity.meals.reduce((sum, m) => sum + m.calories, 0);
  const workoutCal = todayActivity.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const stepCal = calculateStepCalories(todayActivity.steps, user.weightKg);
  const netCal = calculateNetCalories(foodCal, bmr, workoutCal, stepCal);

  const shareText = `🔥 Yodha Fitness Report - Level ${user.level} ${user.title}\n` +
    `⚡ Streak: ${user.currentStreak} Days\n` +
    `👟 Steps: ${todayActivity.steps.toLocaleString()}\n` +
    `🔥 Active Burn: ${todayActivity.caloriesBurned} kcal\n` +
    (totalPushupsToday > 0 ? `💪 Pushups: ${totalPushupsToday} reps\n` : '') +
    `🥗 Net Calorie Balance: ${netCal.net > 0 ? `+${netCal.net}` : netCal.net} kcal\n` +
    `Join me on the global leaderboard at Yodha Fitness! ⚔️`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Yodha Fitness: Level ${user.level} Stats`,
          text: shareText,
          url: window.location.href,
        });
      } catch {}
    } else {
      handleCopyText();
    }
  };

  const handleDownloadCanvas = () => {
    // Generate clean canvas card image
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 900);
    if (cardTheme === 'emerald') {
      gradient.addColorStop(0, '#06281e');
      gradient.addColorStop(0.5, '#05111b');
      gradient.addColorStop(1, '#02060d');
    } else if (cardTheme === 'violet') {
      gradient.addColorStop(0, '#260a3a');
      gradient.addColorStop(0.5, '#0c0720');
      gradient.addColorStop(1, '#02060d');
    } else {
      gradient.addColorStop(0, '#331700');
      gradient.addColorStop(0.5, '#190d02');
      gradient.addColorStop(1, '#02060d');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 900);

    // Accent borders
    ctx.lineWidth = 6;
    ctx.strokeStyle = cardTheme === 'emerald' ? '#10b981' : cardTheme === 'violet' ? '#8b5cf6' : '#f59e0b';
    ctx.strokeRect(20, 20, 760, 860);

    // App header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('YODHA FITNESS', 60, 85);

    ctx.fillStyle = cardTheme === 'emerald' ? '#34d399' : cardTheme === 'violet' ? '#a78bfa' : '#fbbf24';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`WARRIOR LOG • ${todayActivity.date}`, 60, 120);

    // User profile section
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(user.name, 60, 195);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Level ${user.level} • ${user.title} (${user.rankTier} League)`, 60, 235);

    // Stat boxes
    const drawStatBox = (x: number, y: number, w: number, h: number, label: string, val: string, sub: string) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(label.toUpperCase(), x + 24, y + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(val, x + 24, y + 92);

      ctx.fillStyle = '#34d399';
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(sub, x + 24, y + 130);
    };

    drawStatBox(60, 280, 320, 150, 'Daily Steps', todayActivity.steps.toLocaleString(), 'Target: 10,000');
    drawStatBox(420, 280, 320, 150, 'Active Burn', `${todayActivity.caloriesBurned} kcal`, 'Workout & Movement');
    drawStatBox(60, 460, 320, 150, 'Pushup Master', `${totalPushupsToday} Reps`, 'Total Chest Reps');
    drawStatBox(420, 460, 320, 150, 'Current Streak', `${user.currentStreak} Days`, '🔥 Unbroken Iron Streak');

    // Net Caloric section
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(60, 640, 680, 140);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(60, 640, 680, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NET CALORIC METRIC', 90, 685);

    ctx.fillStyle = netCal.net <= 0 ? '#34d399' : '#f59e0b';
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${netCal.net > 0 ? `+${netCal.net}` : netCal.net} kcal (${netCal.status.toUpperCase()})`, 90, 730);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Food: ${foodCal} kcal | BMR: ${bmr} kcal | Burned: ${workoutCal + stepCal} kcal`, 90, 760);

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Generated via Yodha Fitness Android RPG • Awaken Your Inner Warrior', 60, 840);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `YodhaFitness-Stats-${todayActivity.date}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 id="share-dialog-title" className="font-game font-bold text-white text-base">Share Activity Summary</h3>
          </div>
          <button
            onClick={() => setShareModal(false)}
            aria-label="Close share dialog"
            className="p-1 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center justify-between py-2 text-xs">
          <span className="text-slate-400 font-medium">Card Aesthetic:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCardTheme('emerald')}
              aria-label="Emerald theme"
              className={`w-6 h-6 rounded-full bg-emerald-500 border-2 transition-all cursor-pointer ${
                cardTheme === 'emerald' ? 'border-white scale-110 shadow-lg shadow-emerald-500/50' : 'border-transparent opacity-60'
              }`}
            />
            <button
              onClick={() => setCardTheme('violet')}
              aria-label="Violet theme"
              className={`w-6 h-6 rounded-full bg-violet-500 border-2 transition-all cursor-pointer ${
                cardTheme === 'violet' ? 'border-white scale-110 shadow-lg shadow-violet-500/50' : 'border-transparent opacity-60'
              }`}
            />
            <button
              onClick={() => setCardTheme('amber')}
              aria-label="Amber theme"
              className={`w-6 h-6 rounded-full bg-amber-500 border-2 transition-all cursor-pointer ${
                cardTheme === 'amber' ? 'border-white scale-110 shadow-lg shadow-amber-500/50' : 'border-transparent opacity-60'
              }`}
            />
          </div>
        </div>

        {/* Preview Card */}
        <div
          ref={cardRef}
          className={`my-3 p-5 rounded-2xl border transition-all ${
            cardTheme === 'emerald'
              ? 'bg-gradient-to-br from-emerald-950/70 via-slate-950 to-slate-900 border-emerald-500/40 shadow-emerald-950/40'
              : cardTheme === 'violet'
              ? 'bg-gradient-to-br from-violet-950/70 via-slate-950 to-slate-900 border-violet-500/40 shadow-violet-950/40'
              : 'bg-gradient-to-br from-amber-950/70 via-slate-950 to-slate-900 border-amber-500/40 shadow-amber-950/40'
          } shadow-2xl relative overflow-hidden`}
        >
          {/* Card Top Brand */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-game font-black text-xs tracking-wider text-slate-100 uppercase">
                Yodha Fitness
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{user.currentStreak}d Streak</span>
            </div>
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-game font-black text-base text-emerald-950 shrink-0">
              LV{user.level}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-white text-sm truncate">{user.name}</h4>
              <p className="text-xs text-emerald-400 font-medium truncate">{user.title} • {user.rankTier} League</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-left mb-3">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Footprints className="w-3 h-3 text-teal-400" /> Steps
              </div>
              <div className="text-base font-black font-mono text-white mt-0.5">
                {todayActivity.steps.toLocaleString()}
              </div>
              <div className="text-[10px] text-teal-400">Target: 10k</div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Zap className="w-3 h-3 text-amber-400" /> Active Burn
              </div>
              <div className="text-base font-black font-mono text-white mt-0.5">
                {todayActivity.caloriesBurned} <span className="text-xs font-normal text-slate-400">kcal</span>
              </div>
              <div className="text-[10px] text-amber-400">Workout + Steps</div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Dumbbell className="w-3 h-3 text-indigo-400" /> Pushup Reps
              </div>
              <div className="text-base font-black font-mono text-white mt-0.5">
                {totalPushupsToday} <span className="text-xs font-normal text-slate-400">reps</span>
              </div>
              <div className="text-[10px] text-indigo-400">Chest Power</div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Flame className="w-3 h-3 text-rose-400" /> Net Balance
              </div>
              <div className="text-base font-black font-mono text-white mt-0.5">
                {netCal.net > 0 ? `+${netCal.net}` : netCal.net} <span className="text-xs font-normal text-slate-400">kcal</span>
              </div>
              <div className="text-[10px] text-rose-400 capitalize">{netCal.status}</div>
            </div>
          </div>

          <div className="text-[10px] text-center text-slate-400 font-mono">
            {todayActivity.date} • Level Up With Me on Yodha Fitness
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={handleDownloadCanvas}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Save Image (PNG)</span>
          </button>

          <button
            onClick={handleCopyText}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>
        </div>

        {/* Native Share & Direct Links */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleNativeShare}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-emerald-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via Android Share Sheet</span>
          </button>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share stats to X Twitter"
            className="p-3 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center justify-center font-bold text-xs"
            title="Share to X / Twitter"
          >
            𝕏
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share stats to WhatsApp"
            className="p-3 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center font-bold text-xs"
            title="Share to WhatsApp"
          >
            💬
          </a>
        </div>
      </div>
    </div>
  );
};
