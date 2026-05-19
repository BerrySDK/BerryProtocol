function containsPortugueseSignals(text) {
  return /\b(ol[aá]|voc[eê]|como|quero|preciso|ajuda|integra[cç][aã]o|mensagem|lista|bot[oõ]es|carrossel|c[oó]digo|obrigado|valeu)\b/i.test(
    text,
  );
}

function containsEnglishSignals(text) {
  return /\b(hello|hi|need|want|help|integration|message|list|buttons|carousel|code|thanks|please|documentation|agent)\b/i.test(
    text,
  );
}

export function detectUserLanguage(text, fallback = "pt-BR") {
  const value = String(text || "").trim();
  if (!value) {
    return fallback;
  }

  const hasPortugueseDiacritics = /[ãõáàâéêíóôúç]/i.test(value);
  if (hasPortugueseDiacritics || containsPortugueseSignals(value)) {
    return "pt-BR";
  }

  if (containsEnglishSignals(value)) {
    return "en";
  }

  return fallback;
}

export function formatLanguageLabel(language) {
  if (language === "en") return "English";
  if (language === "pt-BR") return "Português (Brasil)";
  return language;
}
