import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Shield,
  Flame,
  Check,
  AlertCircle,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Cloud,
  CheckCircle2,
  Copy,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';
import { useFitness } from '../context/FitnessContext';
import { sounds } from '../utils/soundEffects';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export const FirebaseLoginModal: React.FC = () => {
  const {
    activeAuthModal,
    setActiveAuthModal,
    currentUser,
    loginAction,
    logoutAction,
    loginWithEmailAction,
    registerWithEmailAction,
    loginGuestAction,
    resetPasswordAction,
    syncCloudData,
    isSyncing,
    lastSyncedAt,
    user,
  } = useFitness();

  const { dialogRef } = useDialogAccessibility({
    isOpen: Boolean(activeAuthModal),
    onClose: () => setActiveAuthModal(false),
  });

  const [activeTab, setActiveTab] = useState<'google' | 'email' | 'guest'>('google');
  const [emailMode, setEmailMode] = useState<'signin' | 'register'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  if (!activeAuthModal) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginAction();
      setSuccessMsg('Signed in successfully with Google!');
      setTimeout(() => {
        setActiveAuthModal(false);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Sign-in cancelled. Please try again.');
      } else {
        setErrorMsg('Google Sign-in failed. Please check connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (emailMode === 'signin') {
        await loginWithEmailAction(email, password);
        setSuccessMsg('Welcome back! Signed in successfully.');
      } else {
        await registerWithEmailAction(email, password, displayName.trim() || undefined);
        setSuccessMsg('Warrior account registered and synced!');
      }
      setTimeout(() => {
        setActiveAuthModal(false);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        setErrorMsg('Invalid email or password. Please verify credentials.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setErrorMsg('This email is already registered. Please sign in instead.');
      } else if (msg.includes('auth/invalid-email')) {
        setErrorMsg('Please provide a valid email address.');
      } else if (msg.includes('auth/weak-password')) {
        setErrorMsg('Password is too weak. Use at least 6 characters.');
      } else {
        setErrorMsg(msg.replace(/^Firebase:\s*/, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginGuestAction();
      setSuccessMsg('Guest session initialized! Cloud stats enabled.');
      setTimeout(() => {
        setActiveAuthModal(false);
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Enter your email above first to receive a password reset link.');
      return;
    }
    setErrorMsg(null);
    try {
      await resetPasswordAction(email);
      setSuccessMsg(`Password reset email dispatched to ${email}!`);
    } catch {
      setErrorMsg('Could not send reset email. Ensure the email address is correct.');
    }
  };

  const handleCopyUid = async () => {
    if (!currentUser?.uid) return;
    try {
      await navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      sounds.playRepCount();
      setTimeout(() => setCopiedUid(false), 2000);
    } catch {}
  };

  const handleManualSync = async () => {
    sounds.playStreakFlame();
    await syncCloudData();
    setSuccessMsg('Cloud Firestore synced with local stats!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Provider label
  const getProviderLabel = () => {
    if (!currentUser) return 'Offline';
    if (currentUser.isAnonymous) return 'Anonymous Guest';
    const provider = currentUser.providerData?.[0]?.providerId;
    if (provider === 'google.com') return 'Google Account';
    if (provider === 'password') return 'Email / Password';
    return 'Firebase Auth';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md max-h-[90vh] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-white/10 rounded-[32px] p-5 shadow-2xl flex flex-col overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="auth-dialog-title" className="font-game font-bold text-white text-base">Firebase Cloud Realm</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  Auth & Sync
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                ai-studio-apexquestfitness-57ca4607
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveAuthModal(false)}
            aria-label="Close authentication dialog"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STATE A: USER IS LOGGED IN TO FIREBASE
        ═══════════════════════════════════════════════ */}
        {currentUser ? (
          <div className="space-y-4">
            {/* Identity Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={currentUser.photoURL || user.avatar}
                    alt={currentUser.displayName || user.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/60"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-emerald-950 text-[10px] font-black font-game px-1.5 rounded-full border border-black">
                    LV{user.level}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-white text-base truncate">
                      {currentUser.displayName || user.name}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                      {user.rankTier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {currentUser.email || 'Anonymous Guest Warrior'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-emerald-400">
                    <Shield className="w-3 h-3" />
                    <span>{getProviderLabel()}</span>
                  </div>
                </div>
              </div>

              {/* UID info */}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[200px]">UID: {currentUser.uid}</span>
                <button
                  onClick={handleCopyUid}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-white/5 cursor-pointer"
                >
                  {copiedUid ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy UID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cloud Sync Center */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="font-game font-bold text-white text-xs">
                    Live Firestore Synchronization
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Synced
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Current Streak</span>
                  <span className="text-white font-bold font-game text-sm flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {user.currentStreak} Days
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Total Experience</span>
                  <span className="text-emerald-400 font-bold font-game text-sm flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {user.totalXp?.toLocaleString() || user.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Last Cloud Backup:</span>
                <span className="font-mono text-slate-200">{lastSyncedAt || 'Active Session'}</span>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-game font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Backing up to Firestore...' : 'Sync Stats to Cloud Now'}</span>
              </button>
            </div>

            {/* Sign Out Action */}
            <button
              onClick={async () => {
                await logoutAction();
                setActiveAuthModal(false);
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-game font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out from Firebase</span>
            </button>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════
             STATE B: USER IS NOT LOGGED IN (AUTH TABS)
          ═══════════════════════════════════════════════ */
          <div className="space-y-4">
            {/* Value Proposition */}
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold font-game">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Link Your Cloud Warrior Identity</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connect your account to save quest streaks, retain unlocked achievements, and appear verified on the global leaderboard.
              </p>
            </div>

            {/* Auth Tab Pills */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('google');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2 rounded-xl font-game font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'google'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('email');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2 rounded-xl font-game font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'email'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('guest');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2 rounded-xl font-game font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'guest'
                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Guest</span>
              </button>
            </div>

            {/* 1. GOOGLE ONE-TAP TAB */}
            {activeTab === 'google' && (
              <div className="space-y-3 pt-1">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 cursor-pointer shadow-lg transition-transform active:scale-98 disabled:opacity-50"
                >
                  {/* Google SVG Icon */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Connecting with Google...' : 'Continue with Google Account'}</span>
                </button>

                <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-blue-300 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span>⚡ One-Click Cloud Integration:</span>
                  </div>
                  <p className="text-slate-400">
                    Pulls your Google display name and profile picture automatically. Zero passwords required.
                  </p>
                </div>
              </div>
            )}

            {/* 2. EMAIL & PASSWORD TAB */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
                {/* Switcher between Sign In and Register */}
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-bold text-slate-300">
                    {emailMode === 'signin' ? 'Sign In to Your Account' : 'Register New Warrior'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode(emailMode === 'signin' ? 'register' : 'signin');
                      setErrorMsg(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline text-[11px]"
                  >
                    {emailMode === 'signin' ? 'Create new account?' : 'Already registered?'}
                  </button>
                </div>

                {emailMode === 'register' && (
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Warrior Call-Sign / Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Arjun Warrior"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="warrior@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      Password
                    </label>
                    {emailMode === 'signin' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black font-game text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50"
                >
                  {emailMode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>
                    {loading
                      ? 'Authenticating...'
                      : emailMode === 'signin'
                      ? 'Sign In to Yodha Realm'
                      : 'Create Warrior Profile'}
                  </span>
                </button>
              </form>
            )}

            {/* 3. GUEST MODE TAB */}
            {activeTab === 'guest' && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold font-game">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Instant Anonymous Session</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Play immediately with full Firebase Firestore syncing without entering an email or password. You can upgrade to a permanent Google or Email account later.
                  </p>
                </div>

                <button
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold font-game text-xs flex items-center justify-center gap-2 cursor-pointer border border-white/10 active:scale-98 transition-all disabled:opacity-50"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>{loading ? 'Starting Guest Session...' : 'Play as Anonymous Guest'}</span>
                </button>
              </div>
            )}

            {/* Security Guarantee */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>Protected by Firestore Database Security Rules</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
