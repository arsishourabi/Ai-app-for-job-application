const { createJobPost } = require("../../schema/jobPost");
const { inferRemoteTypesFromText } = require("../workTypeOptions");

function readSerpApplyLink(job) {
  if (Array.isArray(job.apply_options) && job.apply_options[0]) {
    return job.apply_options[0].link || "";
  }
  if (Array.isArray(job.related_links) && job.related_links[0]) {
    return job.related_links[0].link || "";
  }
  return job.share_link || job.link || "";
}

function mapSerpApiSiteJob(job, source) {
  const detectedExtensions = job.detected_extensions || {};
  const description = job.description || "";
  const remoteTypes = inferRemoteTypesFromText(job.title, job.location, description);

  return createJobPost({
    title: job.title,
    description,
    company: job.company_name || job.company,
    location: job.location || "Remote",
    source,
    date_posted: detectedExtensions.posted_at || job.date_posted || null,
    applicant_count: null,
    job_type: detectedExtensions.schedule_type ? [detectedExtensions.schedule_type] : [],
    remote_type: remoteTypes.length ? remoteTypes : ["remote"],
    is_contractor: /contract|contractor|freelance/i.test(`${job.title || ""} ${description}`),
    is_visa_sponsored: /visa|sponsor|relocation assistance|relocation support/i.test(description),
    work_from_anywhere: /worldwide|global|anywhere|work from anywhere/i.test(`${job.location || ""} ${description}`),
    language: job.language,
    apply_link: readSerpApplyLink(job)
  });
}

async function fetchSerpApiSiteJobs(searchQuery, { site, source, querySuffix = "" }) {
  if (!process.env.SERPAPI_API_KEY) return [];

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", `"${searchQuery.role}" remote ${querySuffix} site:${site}`.trim());
    url.searchParams.set("location", searchQuery.location || "Worldwide");
    url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

    const response = await fetch(url);
    if (!response.ok) return [];

    const payload = await response.json();
    const jobs = Array.isArray(payload.jobs_results) ? payload.jobs_results : [];
    return jobs.map((job) => mapSerpApiSiteJob(job, source));
  } catch {
    return [];
  }
}

module.exports = {
  fetchSerpApiSiteJobs,
  mapSerpApiSiteJob
};
