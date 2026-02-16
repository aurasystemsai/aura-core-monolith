// Product SEO Engine: i18n module
const dictionaries = {
  en: {
    title: "Product SEO",
    generate: "Generate SEO",
    saving: "Saving...",
  },
  fr: {
    title: "SEO Produit",
    generate: "Générer le SEO",
    saving: "Enregistrement...",
  },
  es: {
    title: "SEO de Producto",
    generate: "Generar SEO",
    saving: "Guardando...",
  },
};

function t(key, locale = "en") {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict[key] || dictionaries.en[key] || key;
}

function getAll() {
  return dictionaries;
}

module.exports = { t, dictionaries, getAll };
