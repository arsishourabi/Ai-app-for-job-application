const { isKnownSponsor } = require("./utils/global_sponsors");

const POSITIVE_VISA_PATTERNS = Object.freeze([
  /\bvisa sponsorship\b/i,
  /\bvisa support\b/i,
  /\bsponsorship available\b/i,
  /\brelocation assistance\b/i,
  /\brelocation support\b/i,
  /\bsponsor(?:s|ed|ing)? work visa\b/i
]);

const NEGATIVE_VISA_PATTERNS = Object.freeze([
  /\bno sponsorship\b/i,
  /\bwithout sponsorship\b/i,
  /\bnot sponsor(?:ing)?\b/i,
  /\bvisa sponsorship is not available\b/i,
  /\bmust already be authorized\b/i
]);

function readVisaText(job) {
  return [
    job.title,
    job.description,
    job.snippet,
    job.company,
    job.company_name,
    job.location
  ]
    .filter(Boolean)
    .join(" ");
}

function hasPositiveVisaSignal(job) {
  const text = readVisaText(job);
  return POSITIVE_VISA_PATTERNS.some((pattern) => pattern.test(text)) &&
    !NEGATIVE_VISA_PATTERNS.some((pattern) => pattern.test(text));
}

function hasSponsorRegistryMatch(job) {
  return isKnownSponsor(job.company || job.company_name);
}

function isVisaSponsoredJob(job) {
  return Boolean(job.is_visa_sponsored) || hasPositiveVisaSignal(job) || hasSponsorRegistryMatch(job);
}

function enrichVisaSponsorship(job) {
  return {
    ...job,
    is_visa_sponsored: isVisaSponsoredJob(job)
  };
}

module.exports = {
  enrichVisaSponsorship,
  hasPositiveVisaSignal,
  hasSponsorRegistryMatch,
  isVisaSponsoredJob
};
