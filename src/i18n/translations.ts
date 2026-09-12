import { Language, LanguageOption, SUPPORTED_LANGUAGES } from './types';
import { enTranslations } from './locales/en';
import { hiTranslations } from './locales/hi';
import { mrTranslations } from './locales/mr';
import { guTranslations } from './locales/gu';
import { bnTranslations } from './locales/bn';
import { taTranslations } from './locales/ta';
import { teTranslations } from './locales/te';
import { knTranslations } from './locales/kn';

export type { Language, LanguageOption };
export { SUPPORTED_LANGUAGES };

export const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations,
  gu: guTranslations,
  bn: bnTranslations,
  ta: taTranslations,
  te: teTranslations,
  kn: knTranslations,
};
