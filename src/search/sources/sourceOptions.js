const SOURCE_OPTIONS = Object.freeze([
  { key: "google", label: "Google Jobs", defaultEnabled: true },
  { key: "linkedin", label: "LinkedIn", defaultEnabled: true },
  { key: "linkedin_posts", label: "LinkedIn Feed", defaultEnabled: true },
  { key: "indeed", label: "Indeed", defaultEnabled: true },
  { key: "telegram", label: "Telegram", defaultEnabled: true },
  { key: "dynamite_jobs", label: "Dynamite Jobs", defaultEnabled: true },
  { key: "weworkremotely", label: "We Work Remotely", defaultEnabled: true },
  { key: "remoteco", label: "Remote.co", defaultEnabled: true },
  { key: "jobspresso", label: "Jobspresso", defaultEnabled: true },
  { key: "working_nomads", label: "Working Nomads", defaultEnabled: true },
  { key: "js_remotely", label: "JS Remotely", defaultEnabled: true }
]);

const ALLOWED_SOURCE_KEYS = Object.freeze(SOURCE_OPTIONS.map((source) => source.key));
const DEFAULT_SOURCE_KEYS = Object.freeze(
  SOURCE_OPTIONS
    .filter((source) => source.defaultEnabled)
    .map((source) => source.key)
);

function isAllowedSourceKey(value) {
  return ALLOWED_SOURCE_KEYS.includes(String(value || "").trim().toLowerCase());
}

function normalizeSourceKeys(value) {
  if (!value) return [...DEFAULT_SOURCE_KEYS];
  const list = Array.isArray(value) ? value : [value];
  const selected = list
    .map((source) => String(source).trim().toLowerCase())
    .filter(isAllowedSourceKey);

  return selected.length ? selected : [...DEFAULT_SOURCE_KEYS];
}

module.exports = {
  ALLOWED_SOURCE_KEYS,
  DEFAULT_SOURCE_KEYS,
  SOURCE_OPTIONS,
  isAllowedSourceKey,
  normalizeSourceKeys
};
