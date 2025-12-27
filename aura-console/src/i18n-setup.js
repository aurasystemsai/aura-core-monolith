import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // ...existing English translations
    }
  },
  es: {
    translation: {
      // Example Spanish translations (fill in as needed)
      welcome: "Bienvenido a AURA Console",
      onboarding_intro: "Comience con la automatización de clase mundial para el comercio electrónico...",
      // ...add more keys as needed
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
