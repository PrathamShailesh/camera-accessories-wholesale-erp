'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Globe2,
  Server,
  Fingerprint,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Load saved email and global settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('erp_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {});
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your corporate email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      setSuccessMessage(`Authenticated successfully. Welcome, ${data.user.name}!`);

      // Store in localStorage for client state persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('erp_current_user', JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem('erp_remembered_email', cleanEmail);
        } else {
          localStorage.removeItem('erp_remembered_email');
        }
      }

      setTimeout(() => {
        if (data.user.role === 'DEPOT_USER') {
          router.push('/depot');
        } else {
          router.push('/dashboard');
        }
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const brandName = settings?.tradingName || settings?.companyName || 'GROWTH BRIDGE';
  const logoUrl = settings?.logoUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[650px] h-[650px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            {logoUrl ? (
              <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-glow border border-slate-700/80 bg-slate-900 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-500 text-white shadow-glow ring-1 ring-white/20">
                <Camera className="h-7 w-7 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            {brandName}
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
              ERP
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Camera & Optical Equipment Wholesale Operating System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 bg-slate-900/95 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-brand-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">Enterprise Sign In</h2>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TLS 256-bit</span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in shadow-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in shadow-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold tracking-wide">Work Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.admin@lenscore.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all font-mono shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-semibold tracking-wide">Security Password</label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-medium transition-colors hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  placeholder="Enter your security password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-11 py-3 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all font-mono shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Caps Lock Detection Alert */}
              {capsLockOn && (
                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-amber-400 animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Caps Lock is ON</span>
                </div>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-brand-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer accent-brand-500"
                />
                <span className="group-hover:text-slate-300 transition-colors text-[11px]">
                  Remember my work email
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Help</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-3 pb-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Growth Bridge</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Infrastructure Footer Badge */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
              <span>Multi-Depot Authorization</span>
            </div>
            <div className="flex items-center gap-1">
              <Server className="h-3 w-3 text-cyan-400" />
              <span>DXB • SIN • BLR • BOM</span>
            </div>
          </div>
        </div>

        {/* Official Footer Notice */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>GROWTH BRIDGE Wholesale Distribution LLC &bull; Dubai &bull; Singapore &bull; Bangalore &bull; Mumbai</p>
          <p className="text-slate-600 text-[10px]">
            Restricted Enterprise Access &bull; ISO/IEC 27001 Certified Infrastructure
          </p>
        </div>
      </div>

      {/* Password Assistance & Credential Support Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Enterprise Access Support</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                To maintain SOC-2 & ISO-27001 wholesale security protocols, ERP user accounts and credential resets are managed centrally by your Super Administrator.
              </p>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Administrative Contacts
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                  <span className="text-slate-400">Super Administrator:</span>
                  <span className="text-brand-400 font-mono font-medium">sarah.admin@lenscore.com</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-400">IT Operations Desk:</span>
                  <span className="text-cyan-400 font-mono font-medium">support@lenscore.com</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-[11px] leading-relaxed">
                💡 <span className="font-semibold">Staff Tip:</span> If you are assigned to a warehouse (Dubai or Bangalore), your account automatically opens the mobile depot fulfillment interface upon sign-in.
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href="mailto:support@lenscore.com?subject=ERP%20Password%20Reset%20Request"
                className="flex-1 text-center py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
              >
                Email Support Desk
              </a>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
