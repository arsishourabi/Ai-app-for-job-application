const { normalizeFilters } = require("../filters/jobFilters");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function normalizeAlertFilters(input = {}) {
  return normalizeFilters({
    role: input.role,
    location: input.location,
    job_type: input.job_type,
    jobType: input.jobType,
    jobTypeMode: input.job_type_mode || input.jobTypeMode,
    remote_type: input.remote_type,
    remoteType: input.remoteType,
    remoteTypeMode: input.remote_type_mode || input.remoteTypeMode,
    workFromAnywhere: normalizeBoolean(input.work_from_anywhere ?? input.workFromAnywhere),
    isContractor: normalizeBoolean(input.is_contractor ?? input.isContractor),
    visa_sponsorship: normalizeBoolean(input.visa_sponsorship ?? input.is_visa_sponsored ?? input.isVisaSponsored),
    under_10_applicants: normalizeBoolean(input.under_10_applicants ?? input.under10Applicants),
    languages: input.languages ?? input.language,
    residency_preference: input.residency_preference ?? input.residencyPreference,
    sources: input.sources
  });
}

function validateAlertSubscription(input = {}) {
  const email = String(input.email || "").trim().toLowerCase();
  const filters = normalizeAlertFilters(input.filters || input);
  const errors = [];

  if (!EMAIL_PATTERN.test(email)) {
    errors.push("A valid email is required.");
  }

  if (!filters.role) {
    errors.push("filters.role is required.");
  }

  return {
    email,
    filters,
    errors,
    valid: errors.length === 0
  };
}

module.exports = {
  normalizeAlertFilters,
  validateAlertSubscription
};
