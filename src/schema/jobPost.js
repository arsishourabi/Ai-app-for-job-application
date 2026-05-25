const JOB_SOURCES = Object.freeze({
  LINKEDIN: "LinkedIn",
  GOOGLE: "Google",
  INDEED: "Indeed",
  TELEGRAM: "Telegram",
  DYNAMITE_JOBS: "Dynamite Jobs",
  WE_WORK_REMOTELY: "We Work Remotely",
  REMOTE_CO: "Remote.co",
  JOBSPRESSO: "Jobspresso",
  WORKING_NOMADS: "Working Nomads",
  JS_REMOTELY: "JS Remotely",
  JOB_TODAY: "JobToday",
  LEGACY_DYNAMITE_JOBS: "DynamiteJobs"
});

const JOB_POST_SCHEMA = Object.freeze({
  title: "string",
  description: "string",
  company: "string",
  location: "string",
  source: "LinkedIn | Google | Indeed | Telegram | Dynamite Jobs | We Work Remotely | Remote.co | Jobspresso | Working Nomads | JS Remotely | JobToday | DynamiteJobs | string",
  date_posted: "ISO-8601 date string",
  applicant_count: "number | null",
  job_type: "string[]",
  remote_type: "string[]",
  is_contractor: "boolean",
  is_visa_sponsored: "boolean",
  work_from_anywhere: "boolean",
  language: "string",
  apply_link: "string",
  is_mock: "boolean"
});

function createJobPost(input) {
  return {
    title: input.title || "",
    description: input.description || "",
    company: input.company || "",
    location: input.location || "",
    source: input.source || "",
    date_posted: input.date_posted || null,
    applicant_count: Number.isFinite(input.applicant_count) ? input.applicant_count : null,
    job_type: Array.isArray(input.job_type) ? input.job_type : [],
    remote_type: Array.isArray(input.remote_type) ? input.remote_type : [],
    is_contractor: Boolean(input.is_contractor),
    is_visa_sponsored: Boolean(input.is_visa_sponsored),
    work_from_anywhere: Boolean(input.work_from_anywhere),
    language: input.language ? String(input.language).toLowerCase() : "",
    apply_link: input.apply_link || "",
    is_mock: Boolean(input.is_mock)
  };
}

module.exports = {
  JOB_POST_SCHEMA,
  JOB_SOURCES,
  createJobPost
};
