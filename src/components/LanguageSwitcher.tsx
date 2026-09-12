import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'compact' | 'pill' | 'full';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'compact'
}) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  // If pill variant (horizontal scrollable bar)
  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-1 overflow-x-auto py-1 max-w-full no-scrollbar ${className}`}>
        {languages.map((item) => {
          const isActive = item.code === language;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title={`Switch page language to ${item.name} (${item.nativeName})`}
            >
              <span className="font-sans">{item.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="language-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={t('nav.switch_language', 'Switch Language')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-2xs ${
          isOpen
            ? 'bg-slate-100 border-slate-300 text-slate-900'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
        }`}
      >
        <Globe className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-sans tracking-tight">{currentOption.nativeName}</span>
        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
          {currentOption.shortLabel}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Confirmation Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {t('lang.powered_by', 'Whole page converted to')} <strong className="text-amber-400">{currentOption.nativeName}</strong>
          </span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>{t('lang.select', 'Select Language')}</span>
            <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">{t('lang.eight_languages', '8 Languages')}</span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {languages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 text-amber-950 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isSelected ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.shortLabel}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{item.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{t('lang.powered_by', 'Whole page translates automatically')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
