const VALID_MATCH_MODES = new Set(["and", "or"]);

function normalizeList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) => item.toLowerCase());
}

function normalizeMatchMode(value) {
  const mode = String(value || "or").toLowerCase();
  return VALID_MATCH_MODES.has(mode) ? mode : "or";
}

function normalizeFilters(input) {
  const under10Applicants = input.under10Applicants === undefined ? input.under_10_applicants : input.under10Applicants;
  const visaSponsorship = input.visaSponsorship === undefined ? input.visa_sponsorship : input.visaSponsorship;

  return {
    role: String(input.role || "").trim(),
    location: String(input.location || "Worldwide").trim() || "Worldwide",
    jobType: normalizeList(input.jobType || input.job_type),
    jobTypeMode: normalizeMatchMode(input.jobTypeMode),
    remoteType: normalizeList(input.remoteType || input.remote_type),
    remoteTypeMode: normalizeMatchMode(input.remoteTypeMode),
    workFromAnywhere: input.workFromAnywhere === undefined ? undefined : Boolean(input.workFromAnywhere),
    isContractor: input.isContractor === undefined ? undefined : Boolean(input.isContractor),
    isVisaSponsored: input.isVisaSponsored === undefined && visaSponsorship === undefined ? undefined : Boolean(input.isVisaSponsored ?? visaSponsorship),
    under10Applicants: under10Applicants === undefined ? undefined : Boolean(under10Applicants),
    language: input.language ? String(input.language).toLowerCase() : undefined,
    sources: normalizeList(input.sources)
  };
}

function matchesList(candidateValues, selectedValues, mode) {
  if (!selectedValues.length) return true;
  const candidateSet = new Set(normalizeList(candidateValues));

  if (mode === "and") {
    return selectedValues.every((value) => candidateSet.has(value));
  }

  return selectedValues.some((value) => candidateSet.has(value));
}

function applyJobFilters(jobs, filters) {
  return jobs.filter((job) => {
    if (!matchesList(job.job_type, filters.jobType, filters.jobTypeMode)) return false;
    if (!matchesList(job.remote_type, filters.remoteType, filters.remoteTypeMode)) return false;
    if (filters.workFromAnywhere !== undefined && job.work_from_anywhere !== filters.workFromAnywhere) return false;
    if (filters.isContractor !== undefined && job.is_contractor !== filters.isContractor) return false;
    if (filters.isVisaSponsored !== undefined && job.is_visa_sponsored !== filters.isVisaSponsored) return false;
    if (filters.under10Applicants && (job.applicant_count === null || job.applicant_count > 9)) return false;
    if (filters.language && String(job.language || "").toLowerCase() !== filters.language) return false;
    return true;
  });
}

module.exports = {
  applyJobFilters,
  normalizeFilters
};
