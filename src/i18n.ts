import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

const STORAGE_KEY = 'fintrack-language';

const getInitialLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const initialLanguage = getInitialLanguage() ?? 'es';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es }
  },
  lng: initialLanguage,
  fallbackLng: 'es',
  interpolation: { escapeValue: false }
});

try {
  document.documentElement.lang = initialLanguage;
} catch {
  // Ignore document access failures.
}

i18n.on('languageChanged', (language) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Ignore storage failures (private mode, disabled storage).
  }
  try {
    document.documentElement.lang = language;
  } catch {
    // Ignore document access failures.
  }
});

export default i18n;
