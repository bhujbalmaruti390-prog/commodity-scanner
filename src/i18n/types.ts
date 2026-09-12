export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'bn' | 'ta' | 'te' | 'kn';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  shortLabel: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', shortLabel: 'EN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', shortLabel: 'हिं' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', shortLabel: 'म' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', shortLabel: 'ગુ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', shortLabel: 'বাं' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', shortLabel: 'த' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', shortLabel: 'తె' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', shortLabel: 'ಕ' }
];
