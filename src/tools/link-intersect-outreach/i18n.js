const strings = { en: { hello: 'Hello' }, es: { hello: 'Hola' } };
module.exports = {
  getStrings: (lang) => strings[lang] || strings['en'],
};
