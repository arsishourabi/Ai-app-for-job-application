const SOURCE_OPTIONS = Object.freeze([
  { key: "google", label: "Google Jobs", defaultEnabled: true },
  { key: "linkedin", label: "LinkedIn", defaultEnabled: true },
  { key: "indeed", label: "Indeed", defaultEnabled: true },
  { key: "telegram", label: "Telegram", defaultEnabled: true }
]);

const ALLOWED_SOURCE_KEYS = Object.freeze(SOURCE_OPTIONS.map((source) => source.key));
const DEFAULT_SOURCE_KEYS = Object.freeze(
  SOURCE_OPTIONS
    .filter((source) => source.defaultEnabled)
    .map((source) => source.key)
);

function normalizeSourceKeys(value) {
  if (!value) return [...DEFAULT_SOURCE_KEYS];
  const list = Array.isArray(value) ? value : [value];
  const selected = list
    .map((source) => String(source).trim().toLowerCase())
    .filter((source) => ALLOWED_SOURCE_KEYS.includes(source));

  return selected.length ? selected : [...DEFAULT_SOURCE_KEYS];
}

module.exports = {
  ALLOWED_SOURCE_KEYS,
  DEFAULT_SOURCE_KEYS,
  SOURCE_OPTIONS,
  normalizeSourceKeys
};
