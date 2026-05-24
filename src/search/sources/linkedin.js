const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");

const MAX_JOB_AGE_DAYS = 30;
const LOW_COMPETITION_AGE_DAYS = 7;
const MAX_APPLICANT_OR_CLICK_COUNT = 20;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseApplicantCount(value) {
  if (Number.isFinite(value)) return value;
  if (!value) return null;

  const normalized = String(value).toLowerCase();
  if (normalized.includes("over") || normalized.includes("+")) return 100;

  const match = normalized.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function parseRelativeDate(value, now = new Date()) {
  if (!value) return null;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (/just now|today/.test(normalized)) return new Date(now);
  if (/yesterday/.test(normalized)) return new Date(now.getTime() - DAY_IN_MS);

  const relativeMatch = normalized.match(/(\d+)\+?\s*(minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago/);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const days =
      unit.startsWith("minute") ? 0 :
        unit.startsWith("hour") ? 0 :
          unit.startsWith("week") ? amount * 7 :
            unit.startsWith("month") ? amount * 30 :
              amount;

    return new Date(now.getTime() - days * DAY_IN_MS);
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

function readApplyLink(job) {
  if (Array.isArray(job.apply_options) && job.apply_options[0]) {
    return job.apply_options[0].link || "";
  }
  if (job.apply_link) return job.apply_link;
  if (job.job_apply_link) return job.job_apply_link;
  if (job.share_link) return job.share_link;
  if (job.link) return job.link;
  return "";
}

function readGoogleJobsResults(payload) {
  if (Array.isArray(payload.jobs_results)) {
    return payload.jobs_results;
  }

  if (payload.jobs_results && Array.isArray(payload.jobs_results.jobs)) {
    return payload.jobs_results.jobs;
  }

  return [];
}

function readTextParts(job) {
  const detectedExtensions = job.detected_extensions || {};
  return [
    job.title,
    job.description,
    job.company_name,
    job.company,
    job.location,
    job.date_posted,
    detectedExtensions.posted_at,
    detectedExtensions.applicants,
    detectedExtensions.applicant_count,
    detectedExtensions.clicks,
    Array.isArray(job.extensions) ? job.extensions.join(" ") : "",
    Array.isArray(job.apply_options) ? job.apply_options.map((option) => `${option.title || ""} ${option.link || ""}`).join(" ") : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function readPostedAt(job) {
  const detectedExtensions = job.detected_extensions || {};
  const extensionDate = Array.isArray(job.extensions)
    ? job.extensions.find((extension) => /ago|today|yesterday|\d{4}/i.test(String(extension)))
    : null;

  return job.date_posted || detectedExtensions.posted_at || extensionDate || null;
}

function readApplicantOrClickCount(job) {
  const detectedExtensions = job.detected_extensions || {};
  const explicitValues = [
    job.applicant_count,
    job.applicants,
    job.num_applicants,
    job.click_count,
    job.clicks,
    detectedExtensions.applicants,
    detectedExtensions.applicant_count,
    detectedExtensions.clicks,
    detectedExtensions.click_count
  ];

  for (const value of explicitValues) {
    const count = parseApplicantCount(value);
    if (count !== null) return count;
  }

  const text = readTextParts(job);
  const match = text.match(/(?:over\s*)?(\d+)\+?\s*(?:applicants?|applications?|clicks?)/i);
  return match ? parseApplicantCount(match[0]) : null;
}

function hasEasyApply(job) {
  return /easy apply/i.test(readTextParts(job));
}

function hasHighVolumeSignal(job) {
  return /(many applicants|high volume|highly competitive|over\s+\d+\s+(applicants?|clicks?)|\d{2,}\+?\s+(applicants?|clicks?)|hundreds?\s+of\s+(applicants?|clicks?))/i.test(readTextParts(job));
}

function getAgeInDays(date, now = new Date()) {
  return (now.getTime() - date.getTime()) / DAY_IN_MS;
}

function isRecentLinkedInJob(job, now = new Date()) {
  const postedAt = parseRelativeDate(readPostedAt(job), now);
  if (!postedAt) return false;
  return getAgeInDays(postedAt, now) <= MAX_JOB_AGE_DAYS;
}

function isLowCompetitionLinkedInJob(job, now = new Date()) {
  const count = readApplicantOrClickCount(job);
  if (count !== null && count >= MAX_APPLICANT_OR_CLICK_COUNT) return false;

  const postedAt = parseRelativeDate(readPostedAt(job), now);
  const ageInDays = postedAt ? getAgeInDays(postedAt, now) : Infinity;
  const easyApply = hasEasyApply(job);

  if (easyApply && count !== null) return true;
  if (hasHighVolumeSignal(job)) return false;

  return ageInDays <= LOW_COMPETITION_AGE_DAYS;
}

function mapLinkedInJob(job) {
  const detectedExtensions = job.detected_extensions || {};
  const description = `${job.description || ""} ${job.extensions ? job.extensions.join(" ") : ""}`;
  const applicantCount = readApplicantOrClickCount(job);

  return createJobPost({
    title: job.title,
    description,
    company: job.company_name || job.company,
    location: job.location,
    source: JOB_SOURCES.LINKEDIN,
    date_posted: job.date_posted || detectedExtensions.posted_at,
    applicant_count: applicantCount,
    job_type: detectedExtensions.schedule_type ? [detectedExtensions.schedule_type] : job.job_type,
    remote_type: /remote/i.test(`${job.location || ""} ${description}`) ? ["remote"] : job.remote_type,
    is_contractor: /contract|contractor/i.test(`${job.title || ""} ${description}`),
    is_visa_sponsored: /visa|sponsor/i.test(description),
    work_from_anywhere: /worldwide|work from anywhere|anywhere/i.test(`${job.location || ""} ${description}`),
    language: job.language,
    apply_link: readApplyLink(job)
  });
}

async function fetchLinkedInJobs(searchQuery) {
  if (!process.env.SERPAPI_API_KEY) {
    return [];
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_jobs");
  url.searchParams.set("q", `"${searchQuery.linkedIn.keywords}" site:linkedin.com`);
  url.searchParams.set("location", searchQuery.linkedIn.location);
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`LinkedIn source failed with status ${response.status}`);
  }

  const payload = await response.json();
  const items = readGoogleJobsResults(payload);

  return items
    .filter((job) => isRecentLinkedInJob(job))
    .filter((job) => isLowCompetitionLinkedInJob(job))
    .map(mapLinkedInJob);
}

module.exports = {
  fetchLinkedInJobs,
  isLowCompetitionLinkedInJob,
  isRecentLinkedInJob,
  mapLinkedInJob,
  parseApplicantCount,
  parseRelativeDate,
  readGoogleJobsResults
};
