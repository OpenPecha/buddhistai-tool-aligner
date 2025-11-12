import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locale/en.json';
import boTranslations from './locale/bo.json';

// Language detection and persistence
const getStoredLanguage = (): string => {
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored && (stored === 'en' || stored === 'bo')) {
      return stored;
    }
  } catch (error) {
    console.error('Error reading language from localStorage:', error);
  }
  return 'en'; // Default to English
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      bo: {
        translation: boTranslations,
      },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('i18nextLng', lng);
  } catch (error) {
    console.error('Error saving language to localStorage:', error);
  }
});

export default i18n;

