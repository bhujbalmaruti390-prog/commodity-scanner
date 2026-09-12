import React, { useState } from 'react';
import { 
  ScanLine, 
  LayoutDashboard, 
  Archive, 
  BookOpen, 
  Menu, 
  X, 
  ShieldCheck, 
  UserCheck,
  User,
  LogOut,
  ChevronDown,
  Building,
  Mail,
  Clock,
  Database
} from 'lucide-react';
import { AuthUser } from '../types/auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';

interface NavbarProps {
  activeTab: 'scanner' | 'dashboard' | 'repository' | 'rules_architecture';
  setActiveTab: (tab: 'scanner' | 'dashboard' | 'repository' | 'rules_architecture') => void;
  userRole?: 'inspector' | 'user';
  inspectionsCount: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isPublic?: boolean;
  onAuthClick?: (mode: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userRole = 'inspector',
  inspectionsCount,
  currentUser,
  onLogout,
  isPublic = false,
  onAuthClick
}) => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleTabClick = (tab: 'scanner' | 'dashboard' | 'repository' | 'rules_architecture') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const isInspector = userRole === 'inspector';

  // Get user initials
  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (isInspector ? 'LM' : 'CU');

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTabClick('scanner')}
                className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
              >
                <div>
                  <span className="font-bold text-base text-slate-900 tracking-tight block">
                    {t('app.title', 'Product Checker')}
                  </span>
                  <span className="text-[11px] text-slate-500 block -mt-0.5">
                    {isInspector ? t('app.inspector_portal', 'Enforcement Officer Portal') : t('app.user_portal', 'Citizen / Consumer Portal')}
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            {!isPublic && (
              <nav className="hidden md:flex items-center gap-1">
                <button
                  id="nav-scanner-btn"
                  onClick={() => handleTabClick('scanner')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition font-medium cursor-pointer ${
                    activeTab === 'scanner'
                      ? (isInspector ? 'bg-amber-50 text-amber-800 font-semibold' : 'bg-emerald-50 text-emerald-800 font-semibold')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                  <span>{t('nav.scanner', 'Scanner')}</span>
                </button>

                <button
                  id="nav-dashboard-btn"
                  onClick={() => handleTabClick('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition font-medium cursor-pointer ${
                    activeTab === 'dashboard'
                      ? (isInspector ? 'bg-amber-50 text-amber-800 font-semibold' : 'bg-emerald-50 text-emerald-800 font-semibold')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('nav.dashboard', 'Dashboard')}</span>
                </button>

                <button
                  id="nav-repository-btn"
                  onClick={() => handleTabClick('repository')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition font-medium cursor-pointer ${
                    activeTab === 'repository'
                      ? (isInspector ? 'bg-amber-50 text-amber-800 font-semibold' : 'bg-emerald-50 text-emerald-800 font-semibold')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>{isInspector ? t('nav.records', 'Inspection Records') : t('nav.my_proofs', 'My Proofs')}</span>
                  {inspectionsCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                      isInspector ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {inspectionsCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-rules-btn"
                  onClick={() => handleTabClick('rules_architecture')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition font-medium cursor-pointer ${
                    activeTab === 'rules_architecture'
                      ? (isInspector ? 'bg-amber-50 text-amber-800 font-semibold' : 'bg-emerald-50 text-emerald-800 font-semibold')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t('nav.rules', 'Rules Guide')}</span>
                </button>
              </nav>
            )}

            {/* Right Side: Language Switcher & Clear Logged-In User Profile Display */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Language Switcher right near profile */}
              <LanguageSwitcher />

              {isPublic ? (
                <div className="flex items-center gap-2 ml-2 border-l border-slate-200 pl-4">
                  <button
                    onClick={() => onAuthClick?.('signin')}
                    className="px-4 py-1.5 text-sm font-bold text-blue-700 bg-white border-2 border-blue-700 rounded-md hover:bg-blue-50 transition cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onAuthClick?.('signup')}
                    className="px-4 py-1.5 text-sm font-bold text-white bg-blue-700 border-2 border-blue-700 rounded-md hover:bg-blue-800 transition cursor-pointer hidden sm:block shadow-sm"
                  >
                    Register
                  </button>
                </div>
              ) : (
                <>
                  {currentUser && (
                    <button
                      type="button"
                      id="navbar-profile-trigger"
                      onClick={() => setShowProfileModal(true)}
                      className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left shadow-2xs"
                      title="Click to view full user profile & session info"
                    >
                      {/* User Avatar Initials */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isInspector 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {initials}
                      </div>

                      {/* Profile info block */}
                      <div className="hidden sm:block leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 max-w-[140px] truncate">
                            {currentUser.name}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase ${
                            isInspector
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {isInspector ? t('role.inspector', 'Inspector') : t('role.user', 'User')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                          {currentUser.email}
                        </span>
                      </div>

                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
                    </button>
                  )}

                  {/* Logout button */}
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      id="navbar-logout-btn"
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                      title={t('nav.logout', 'Sign Out')}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('nav.logout', 'Sign Out')}</span>
                    </button>
                  )}
                </>
              )}

              {/* Mobile menu hamburger button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-md">
            {/* Mobile Language Switcher & Profile Card */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-slate-500">{t('nav.language', 'Language')}:</span>
              <LanguageSwitcher variant="pill" />
            </div>

            {currentUser && (
              <div 
                onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                    isInspector ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{currentUser.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        isInspector ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {isInspector ? t('role.inspector', 'Inspector') : t('role.user', 'User')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{currentUser.email}</span>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-semibold">View</span>
              </div>
            )}

            <button
              onClick={() => handleTabClick('scanner')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>{t('nav.scanner', 'Scanner')}</span>
            </button>

            <button
              onClick={() => handleTabClick('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav.dashboard', 'Dashboard')}</span>
            </button>

            <button
              onClick={() => handleTabClick('repository')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'repository'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4" />
                <span>{isInspector ? t('nav.records', 'Inspection Records') : t('nav.my_proofs', 'My Proofs')}</span>
              </div>
              {inspectionsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {inspectionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('rules_architecture')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'rules_architecture'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('nav.rules', 'Rules Guide')}</span>
            </button>

            {onLogout && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 font-medium transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout', 'Sign Out')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Profile Details Modal: Clear for watching who is logged in */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header banner */}
            <div className={`p-5 text-white ${
              isInspector ? 'bg-gradient-to-r from-amber-600 to-amber-700' : 'bg-gradient-to-r from-emerald-600 to-emerald-700'
            } flex items-start justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-black text-lg border border-white/30">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-900 uppercase">
                      {isInspector ? t('role.inspector', 'Inspector') : t('role.user', 'User')}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold mb-1">
                    {isInspector ? <ShieldCheck className="w-4 h-4 text-amber-600" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                    <span>{t('profile.authority', 'Account Authority')}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {isInspector ? t('profile.inspector_auth', 'Legal Metrology Enforcement Officer') : t('profile.user_auth', 'Citizen / Packaging QA User')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isInspector 
                      ? t('profile.inspector_scope', 'Authorized to issue compounding notices and statutory panchnama')
                      : t('profile.user_scope', 'Authorized to conduct pre-market self-audits and consumer packaging checks')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold mb-1">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>{t('profile.org', 'Organization / Department')}</span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    {currentUser.badgeOrOrg || (isInspector ? t('profile.dept_consumer_affairs', 'Dept. of Consumer Affairs') : t('profile.general_public', 'General Public'))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold mb-1">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>{t('profile.db_status', 'Database Isolation Status')}</span>
                  </div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span>{isInspector ? t('profile.db_isolated_inspector', 'inspector_inspections.json (Strictly Isolated)') : t('profile.db_isolated_user', 'user_inspections.json (Strictly Isolated)')}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t('profile.db_desc', 'Zero data sharing between user and inspector accounts. 100% private and free.')}
                  </div>
                </div>

                {currentUser.loggedInAt && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] px-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('profile.signed_in_at', 'Signed in at:')} {new Date(currentUser.loggedInAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold transition cursor-pointer"
                >
                  {t('profile.close', 'Close')}
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { setShowProfileModal(false); onLogout(); }}
                    className="px-4 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('nav.logout', 'Sign Out')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
