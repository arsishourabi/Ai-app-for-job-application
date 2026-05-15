const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");

async function fetchLinkedInJobs(searchQuery) {
  if (!process.env.LINKEDIN_JOBS_API_URL) {
    return [];
  }

  const url = new URL(process.env.LINKEDIN_JOBS_API_URL);
  url.searchParams.set("keywords", searchQuery.linkedIn.keywords);
  url.searchParams.set("location", searchQuery.linkedIn.location);
  url.searchParams.set("applicant_count_max", String(searchQuery.linkedIn.applicant_count_max));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`LinkedIn source failed with status ${response.status}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.jobs) ? payload.jobs : [];

  return items
    .filter((job) => job.applicant_count === undefined || job.applicant_count < 10)
    .map((job) =>
      createJobPost({
        title: job.title,
        company: job.company,
        location: job.location,
        source: JOB_SOURCES.LINKEDIN,
        date_posted: job.date_posted,
        applicant_count: job.applicant_count,
        job_type: job.job_type,
        remote_type: job.remote_type,
        is_contractor: job.is_contractor,
        is_visa_sponsored: job.is_visa_sponsored,
        work_from_anywhere: job.work_from_anywhere,
        language: job.language,
        apply_link: job.apply_link || job.url
      })
    );
}

module.exports = {
  fetchLinkedInJobs
};
