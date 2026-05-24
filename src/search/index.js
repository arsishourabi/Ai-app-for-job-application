const { applyJobFilters } = require("../filters/jobFilters");
const { JOB_POST_SCHEMA } = require("../schema/jobPost");
const { generateSearchQuery } = require("./generateSearchQuery");
const { detectJobLanguage, ensureJobLanguage } = require("./languageDetection");
const { SOURCE_OPTIONS, sourceAdapters } = require("./sources");

function selectSources(filters) {
  if (!filters.sources.length) return Object.keys(sourceAdapters);
  return filters.sources.filter((source) => sourceAdapters[source]);
}

function dedupeJobs(jobs) {
  const seen = new Set();

  return jobs.filter((job) => {
    const key = [job.title, job.company, job.location, job.apply_link].map((part) => String(part || "").toLowerCase()).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function aggregateJobs(filters) {
  const searchQuery = generateSearchQuery({
    role: filters.role,
    location: filters.location
  });

  const selectedSources = selectSources(filters);
  const settled = await Promise.allSettled(
    selectedSources.map(async (source) => ({
      source,
      jobs: await sourceAdapters[source](searchQuery)
    }))
  );

  const sourceErrors = settled
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason.message);

  const jobs = settled
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value.jobs);

  const normalizedJobs = dedupeJobs(jobs).map(ensureJobLanguage);
  const filteredJobs = applyJobFilters(normalizedJobs, filters);

  return {
    schema: JOB_POST_SCHEMA,
    query: searchQuery,
    filters,
    sources: SOURCE_OPTIONS,
    total: filteredJobs.length,
    jobs: filteredJobs,
    source_errors: sourceErrors
  };
}

module.exports = {
  aggregateJobs,
  detectJobLanguage,
  generateSearchQuery
};
