// i18n for winback tool
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'];
const translations = {
  en: { subject: 'We saved your cart!', body: 'Come back and complete your purchase.' },
  es: { subject: '¡Guardamos tu carrito!', body: 'Vuelve y completa tu compra.' },
  // ...more translations
};

function t(lang, key) {
  return translations[lang] && translations[lang][key] ? translations[lang][key] : translations['en'][key];
}

module.exports = { t, SUPPORTED_LANGUAGES };
