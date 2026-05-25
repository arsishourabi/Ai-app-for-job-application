const { aggregateJobs } = require("../src/search");
const { normalizeFilters } = require("../src/filters/jobFilters");

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readQuery(req) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  return Object.fromEntries(url.searchParams.entries());
}

function parseBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function jobsHandler(req, res) {
  if (req.method && req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const query = readQuery(req);
  const role = query.role || query.Role;

  if (!role) {
    sendJson(res, 400, { error: "Missing required query parameter: role" });
    return;
  }

  const filters = normalizeFilters({
    role,
    location: query.location || query.Location || "Worldwide",
    jobType: parseList(query.job_type || query.jobType),
    jobTypeMode: query.job_type_mode || query.jobTypeMode || "or",
    remoteType: parseList(query.remote_type || query.remoteType),
    remoteTypeMode: query.remote_type_mode || query.remoteTypeMode || "or",
    workFromAnywhere: parseBoolean(query.work_from_anywhere || query.workFromAnywhere),
    isContractor: parseBoolean(query.is_contractor || query.isContractor),
    isVisaSponsored: parseBoolean(query.is_visa_sponsored || query.isVisaSponsored),
    languages: parseList(query.languages || query.language),
    residency_preference: query.residency_preference || query.residencyPreference,
    sources: parseList(query.sources)
  });

  try {
    const result = await aggregateJobs(filters);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, {
      error: "Unable to aggregate jobs",
      detail: error.message
    });
  }
}

module.exports = jobsHandler;
module.exports.default = jobsHandler;
module.exports.jobsHandler = jobsHandler;
