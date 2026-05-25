const GEO_RESTRICTION_PATTERNS = Object.freeze([
  /\b(us|usa|u\.s\.|united states)\s+only\b/i,
  /\b(us|usa|u\.s\.|united states)\s+residents?\b/i,
  /\bnorth america\s+only\b/i,
  /\beurope\s+only\b/i,
  /\buk\s+only\b/i,
  /\bcanada\s+only\b/i,
  /\blatin america\s+only\b/i,
  /\bcitizenship required\b/i,
  /\beligible to work in the (us|usa|u\.s\.|united states)\b/i
]);

const RESIDENCY_PREFERENCES = Object.freeze([
  "No need of residency",
  "US",
  "Canada",
  "Europe",
  "Latin america",
  "Turkey"
]);

const RESIDENCY_PATTERNS = Object.freeze({
  US: [
    /\b(us|usa|u\.s\.|united states|america|american)\b/i,
    /\b(est|cst|mst|pst|us time zones?)\b/i
  ],
  Canada: [/\b(canada|canadian)\b/i],
  Europe: [/\b(europe|european|emea|cet|cest|gmt|bst|uk|united kingdom|germany|france|spain|netherlands)\b/i],
  "Latin america": [/\b(latin america|latam|south america|central america|mexico|brazil|argentina|colombia|chile|peru)\b/i],
  Turkey: [/\b(turkey|turkiye|türkiye|turkish|istanbul|ankara|gmt\+3|utc\+3)\b/i]
});

function readGeoScreeningText(job) {
  return [
    job.title,
    job.description,
    job.location,
    Array.isArray(job.tags) ? job.tags.join(" ") : "",
    Array.isArray(job.remote_type) ? job.remote_type.join(" ") : "",
    Array.isArray(job.job_type) ? job.job_type.join(" ") : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeResidencyPreference(value) {
  const preference = String(value || "").trim();
  return RESIDENCY_PREFERENCES.includes(preference) ? preference : "No need of residency";
}

function hasGeoRestriction(job) {
  const text = readGeoScreeningText(job);
  return GEO_RESTRICTION_PATTERNS.some((pattern) => pattern.test(text));
}

function isWorldwideEligibleJob(job) {
  return !hasGeoRestriction(job);
}

function matchesResidencyPreference(job, preference) {
  const normalizedPreference = normalizeResidencyPreference(preference);
  if (normalizedPreference === "No need of residency") return isWorldwideEligibleJob(job);

  const text = readGeoScreeningText(job);
  const patterns = RESIDENCY_PATTERNS[normalizedPreference] || [];
  return patterns.some((pattern) => pattern.test(text));
}

module.exports = {
  GEO_RESTRICTION_PATTERNS,
  RESIDENCY_PREFERENCES,
  hasGeoRestriction,
  isWorldwideEligibleJob,
  matchesResidencyPreference,
  normalizeResidencyPreference
};
