import React, { useState } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  User, 
  Building, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Loader2,
  Info
} from 'lucide-react';
import { AuthUser, UserRole } from '../types/auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onCancel?: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, onCancel, initialMode = 'signin' }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');

  // Sign up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('inspector');
  const [signUpOrg, setSignUpOrg] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');

  // Handle Sign In submission via Backend Database
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    if (!signInEmail.trim()) {
      setSignInError('Please enter your account email address');
      return;
    }
    if (!signInPassword) {
      setSignInError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInEmail.trim(),
          password: signInPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setSignInError(err.message || 'Login request failed. Check server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'inspector' | 'user') => {
    setIsLoading(true);
    setSignInError('');
    try {
      const email = role === 'inspector' 
        ? 'inspector@legalmetrology.gov.in' 
        : 'user@packagingcompliance.com';
      const password = 'Password@123';

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success && data.user) {
        onLoginSuccess(data.user);
        return;
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
    }

    // Direct fallback user
    onLoginSuccess(role === 'inspector' ? {
      id: 'usr_inspector_seed',
      name: 'Insp. Rajesh Sharma',
      email: 'inspector@legalmetrology.gov.in',
      role: 'inspector',
      badgeOrOrg: 'Dept. of Consumer Affairs (Badge #LM-DL-409)',
      loggedInAt: new Date().toISOString()
    } : {
      id: 'usr_user_seed',
      name: 'Priya Sundaram',
      email: 'user@packagingcompliance.com',
      role: 'user',
      badgeOrOrg: 'Hindustan Packaging QA Labs Ltd',
      loggedInAt: new Date().toISOString()
    });
    setIsLoading(false);
  };

  // Handle Sign Up submission via Backend Database
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    if (!signUpName.trim()) {
      setSignUpError('Please enter your full name');
      return;
    }
    if (!signUpEmail.trim()) {
      setSignUpError('Please enter your email address');
      return;
    }
    if (!signUpPassword) {
      setSignUpError('Please create a password (minimum 6 characters)');
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          role: signUpRole,
          badgeOrOrg: signUpOrg.trim(),
          password: signUpPassword
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Account creation failed.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setSignUpError(err.message || 'Registration failed. Check server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Home
          </button>
        )}
        <LanguageSwitcher />
      </div>

      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 shadow-xl shadow-amber-500/20 border border-amber-300/40 mb-1">
            <Scale className="w-8 h-8 text-slate-950 stroke-[2.3]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t('app.title', 'Product Checker')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {t('app.subtitle', 'Legal Metrology Compliance System')}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-amber-300/90">
            <Database className="w-3 h-3 text-emerald-400" />
            <span>{t('app.gov_badge', 'Govt. of India • LM(PC) Rules 2011')}</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl p-6 backdrop-blur-sm space-y-5">
          {/* Tabs: Sign In / Create Account */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              id="tab-signin"
              onClick={() => { setActiveTab('signin'); setSignInError(''); }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('auth.login_tab', 'Sign In')}
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => { setActiveTab('signup'); setSignUpError(''); }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('auth.register_tab', 'Create Account')}
            </button>
          </div>

          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              {signInError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{signInError}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.email_label', 'Official Email Address')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-signin-email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@domain.gov.in or user@brand.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.pass_label', 'Password')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    id="input-signin-password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-signin"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('auth.verifying', 'Verifying with Database...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.submit_login', 'Sign In')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Quick Demo Access */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('auth.demo_login_title', '1-Click Quick Demo Access')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-quick-demo-inspector"
                    onClick={() => handleQuickDemoLogin('inspector')}
                    className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t('auth.demo_inspector_btn', 'Login as Govt. LM Inspector')}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-quick-demo-user"
                    onClick={() => handleQuickDemoLogin('user')}
                    className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-left"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('auth.demo_user_btn', 'Login as Citizen / Packager')}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[10px] uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('auth.free_accounts', 'Free Database Accounts (Click to autofill)')}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[10px] font-mono">
                    <div 
                      onClick={() => {
                        setSignInEmail('inspector@legalmetrology.gov.in');
                        setSignInPassword('Password@123');
                      }}
                      className="p-1 rounded hover:bg-slate-800/60 cursor-pointer flex justify-between items-center text-amber-300/90"
                      title="Click to populate inspector credentials"
                    >
                      <span>inspector@legalmetrology.gov.in</span>
                      <span className="text-[9px] text-slate-500">[{t('auth.role_inspector_short', 'Inspector')}]</span>
                    </div>
                    <div 
                      onClick={() => {
                        setSignInEmail('user@packagingcompliance.com');
                        setSignInPassword('Password@123');
                      }}
                      className="p-1 rounded hover:bg-slate-800/60 cursor-pointer flex justify-between items-center text-emerald-300/90"
                      title="Click to populate user credentials"
                    >
                      <span>user@packagingcompliance.com</span>
                      <span className="text-[9px] text-slate-500">[{t('auth.role_user_short', 'User')}]</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Account Type Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignUpRole('inspector')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center text-center gap-1 transition cursor-pointer ${
                      signUpRole === 'inspector'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>{t('auth.role_inspector_short', 'Inspector')}</span>
                    <span className="text-[9px] font-normal text-slate-400">{t('auth.role_inspector_title_short', 'Legal Metrology Officer')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignUpRole('user')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center text-center gap-1 transition cursor-pointer ${
                      signUpRole === 'user'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t('auth.role_user_short', 'Citizen / User')}</span>
                    <span className="text-[9px] font-normal text-slate-400">Consumer & QA Labs</span>
                  </button>
                </div>
              </div>

              {signUpError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{signUpError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('auth.name_label', 'Full Name')}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-signup-name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('auth.email_label', 'Email Address')}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="input-signup-email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@domain.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                  />
                </div>
              </div>

              {/* Organization / Dept */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('auth.badge_label', 'Department / Organization')}</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="input-signup-org"
                    value={signUpOrg}
                    onChange={(e) => setSignUpOrg(e.target.value)}
                    placeholder={signUpRole === 'inspector' ? 'Dept. of Consumer Affairs • Delhi' : 'FMCG Packaging Quality QA'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('auth.pass_label', 'Password')}</label>
                  <input
                    type="password"
                    id="input-signup-password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">{t('auth.pass_label', 'Password')} (Confirm)</label>
                  <input
                    type="password"
                    id="input-signup-confirm-password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-signup"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('auth.registering', 'Registering Account in Database...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.submit_register', 'Create Database Account & Access')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Statutory Legal Disclaimer Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            Authorized statutory access under Section 18 &amp; 36 of Legal Metrology Act, 2009.
          </p>
          <p className="text-[10px] text-slate-600">
            Dept. of Consumer Affairs • Ministry of Consumer Affairs, Food &amp; Public Distribution, Govt. of India
          </p>
        </div>
      </div>
    </div>
  );
};
