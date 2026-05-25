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

function hasGeoRestriction(job) {
  const text = readGeoScreeningText(job);
  return GEO_RESTRICTION_PATTERNS.some((pattern) => pattern.test(text));
}

function isWorldwideEligibleJob(job) {
  return !hasGeoRestriction(job);
}

module.exports = {
  GEO_RESTRICTION_PATTERNS,
  hasGeoRestriction,
  isWorldwideEligibleJob
};
