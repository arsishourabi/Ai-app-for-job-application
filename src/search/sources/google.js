const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");

async function fetchGoogleJobs(searchQuery) {
  if (!process.env.SERPAPI_API_KEY) {
    return [];
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", searchQuery.google.engine);
  url.searchParams.set("q", searchQuery.google.query);
  url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google jobs source failed with status ${response.status}`);
  }

  const payload = await response.json();
  const jobs = Array.isArray(payload.jobs_results) ? payload.jobs_results : [];

  return jobs.map((job) =>
    createJobPost({
      title: job.title,
      company: job.company_name,
      location: job.location,
      source: JOB_SOURCES.GOOGLE,
      date_posted: job.detected_extensions && job.detected_extensions.posted_at,
      applicant_count: null,
      job_type: job.detected_extensions && job.detected_extensions.schedule_type ? [job.detected_extensions.schedule_type] : [],
      remote_type: job.location && job.location.toLowerCase().includes("remote") ? ["remote"] : [],
      is_contractor: String(job.title || "").toLowerCase().includes("contract"),
      is_visa_sponsored: false,
      work_from_anywhere: /worldwide|anywhere/i.test(`${job.location || ""} ${job.description || ""}`),
      language: "en",
      apply_link: job.related_links && job.related_links[0] ? job.related_links[0].link : job.share_link
    })
  );
}

module.exports = {
  fetchGoogleJobs
};
