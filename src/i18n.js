import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import jaTranslations from './locales/ja.json';
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: {
        translation: jaTranslations
      },
      en: {
        translation: enTranslations
      },
      zh: {
        translation: zhTranslations
      }
    },
    fallbackLng: 'ja',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
