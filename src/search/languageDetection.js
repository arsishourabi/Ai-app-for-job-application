const LANGUAGE_PATTERNS = Object.freeze({
  tr: [
    /\b(ve|veya|ile|icin|için|bir|bu|olan|olarak|uzaktan|gelistirici|geliştirici|calisma|çalışma|tam zamanli|tam zamanlı)\b/i,
    /[çğıöşü]/i
  ],
  de: [
    /\b(und|oder|fur|für|mit|ein|eine|der|die|das|entwickler|vollzeit|teilzeit|berlin|deutsch)\b/i,
    /[äöüß]/i
  ],
  en: [
    /\b(and|or|for|with|the|a|an|remote|full[- ]time|part[- ]time|engineer|developer|designer)\b/i
  ]
});

function scoreLanguage(text, patterns) {
  return patterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
}

function detectJobLanguage(title, description = "") {
  const text = `${title || ""} ${description || ""}`.trim();
  if (!text) return "en";

  const scores = Object.entries(LANGUAGE_PATTERNS).map(([language, patterns]) => ({
    language,
    score: scoreLanguage(text, patterns)
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];

  return best && best.score > 0 ? best.language : "en";
}

function ensureJobLanguage(job) {
  const language = String(job.language || "").trim().toLowerCase();
  if (language) {
    return {
      ...job,
      language
    };
  }

  return {
    ...job,
    language: detectJobLanguage(job.title, job.description)
  };
}

module.exports = {
  detectJobLanguage,
  ensureJobLanguage
};
