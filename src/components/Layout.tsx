import React, { useState } from 'react';
import { Menu, X, ShieldCheck, UserCheck, LogOut, Clock, Database, Building, Scale, QrCode, LayoutDashboard, Archive, BookOpen } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { AuthUser } from '../types/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userRole?: 'inspector' | 'user';
  inspectionsCount: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isPublic?: boolean;
  onAuthClick?: (mode: 'login' | 'register') => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isInspector = userRole === 'inspector';
  const initials = currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  const navItems = isPublic ? [
    { id: 'scanner', label: t('nav.scanner', 'Scan Product'), icon: QrCode },
    { id: 'rules_architecture', label: t('nav.rules', 'Rules Guide'), icon: BookOpen }
  ] : [
    { id: 'scanner', label: t('nav.scanner', 'Scan Product'), icon: QrCode },
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'repository', label: isInspector ? t('nav.records', 'Inspection Records') : t('nav.my_proofs', 'My Proofs'), icon: Archive, badge: inspectionsCount },
    { id: 'rules_architecture', label: t('nav.rules', 'Rules Guide'), icon: BookOpen }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16 lg:h-20 max-w-[1600px] mx-auto">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button 
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                <Scale className="w-6 h-6 lg:w-7 lg:h-7 text-slate-950" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-bold text-slate-800 text-lg lg:text-xl leading-tight tracking-tight">
                  {t('nav.title', 'Product Checker')}
                </h1>
                <span className="text-[11px] lg:text-xs font-semibold text-amber-600 tracking-wider uppercase mt-0.5">
                  {isPublic ? t('nav.subtitle_public', 'Legal Metrology Assistant') : isInspector ? t('nav.subtitle_inspector', 'Enforcement Officer Portal') : t('nav.subtitle_user', 'Consumer Protection Portal')}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {isPublic ? (
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={() => onAuthClick?.('login')}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
                >
                  {t('nav.sign_in', 'Sign In')}
                </button>
                <button
                  onClick={() => onAuthClick?.('register')}
                  className="text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-xl shadow-xs transition"
                >
                  {t('nav.create_account', 'Create Account')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-[#1e40af] text-white animate-in slide-in-from-left-full">
              <div className="p-4 flex items-center justify-between bg-[#1e3a8a]">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-200">
                  {t('nav.menu_title', 'Menu')}
                </h2>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-blue-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-white text-[#1e40af]'
                        : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-700 text-blue-100">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              {isPublic ? (
                 <div className="p-4 space-y-3 bg-[#1e3a8a] border-t border-blue-800/50">
                    <button onClick={() => { onAuthClick?.('login'); setIsMobileMenuOpen(false); }} className="w-full py-2 text-center text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-700">Sign In</button>
                    <button onClick={() => { onAuthClick?.('register'); setIsMobileMenuOpen(false); }} className="w-full py-2 text-center text-sm font-bold text-[#1e40af] bg-amber-500 rounded-lg hover:bg-amber-400">Create Account</button>
                 </div>
              ) : (
                <div className="p-4 bg-[#1e3a8a] border-t border-blue-800/50 space-y-3">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm text-blue-100 hover:text-white hover:bg-blue-800 transition"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span className="font-semibold">{t('nav.profile', 'Profile')}</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm text-rose-300 hover:text-white hover:bg-rose-600 transition"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">{t('nav.logout', 'Sign Out')}</span>
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/50 relative">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
