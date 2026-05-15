const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");

function buildIndeedSearchUrls(searchQuery) {
  return searchQuery.indeed.hostnames.map((hostname) => {
    const url = new URL(`https://${hostname}/jobs`);
    url.searchParams.set("q", searchQuery.indeed.query);
    if (searchQuery.indeed.location.toLowerCase() !== "worldwide") {
      url.searchParams.set("l", searchQuery.indeed.location);
    }
    return url.toString();
  });
}

async function fetchIndeedJobs(searchQuery) {
  if (!process.env.INDEED_JOBS_API_URL) {
    return [];
  }

  const searchUrls = buildIndeedSearchUrls(searchQuery);
  const jobs = [];

  for (const searchUrl of searchUrls) {
    const url = new URL(process.env.INDEED_JOBS_API_URL);
    url.searchParams.set("search_url", searchUrl);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Indeed source failed with status ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload.jobs) ? payload.jobs : [];
    jobs.push(
      ...items.map((job) =>
        createJobPost({
          title: job.title,
          company: job.company,
          location: job.location,
          source: JOB_SOURCES.INDEED,
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
      )
    );
  }

  return jobs;
}

module.exports = {
  buildIndeedSearchUrls,
  fetchIndeedJobs
};
