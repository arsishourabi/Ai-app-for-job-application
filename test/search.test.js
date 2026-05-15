const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeFilters, applyJobFilters } = require("../src/filters/jobFilters");
const { generateSearchQuery } = require("../src/search/generateSearchQuery");
const { buildIndeedSearchUrls } = require("../src/search/sources/indeed");

test("generateSearchQuery requires a role and defaults location to Worldwide", () => {
  const query = generateSearchQuery({ role: "Backend Engineer" });

  assert.equal(query.location, "Worldwide");
  assert.equal(query.linkedIn.applicant_count_max, 9);
  assert.equal(query.google.engine, "google_jobs");
});

test("Indeed search URLs cover global subdomains", () => {
  const query = generateSearchQuery({ role: "Designer", location: "Istanbul" });
  const urls = buildIndeedSearchUrls(query);

  assert.ok(urls.some((url) => url.includes("www.indeed.com")));
  assert.ok(urls.some((url) => url.includes("uk.indeed.com")));
  assert.ok(urls.some((url) => url.includes("tr.indeed.com")));
});

test("filter logic supports AND and OR for array filters plus work-from-anywhere", () => {
  const jobs = [
    {
      title: "Remote Full Stack Engineer",
      job_type: ["full-time", "contract"],
      remote_type: ["remote", "async"],
      work_from_anywhere: true,
      is_contractor: true,
      is_visa_sponsored: false,
      language: "en"
    },
    {
      title: "Office Engineer",
      job_type: ["full-time"],
      remote_type: ["onsite"],
      work_from_anywhere: false,
      is_contractor: false,
      is_visa_sponsored: true,
      language: "en"
    }
  ];

  const filters = normalizeFilters({
    role: "Engineer",
    jobType: ["full-time", "contract"],
    jobTypeMode: "and",
    remoteType: ["remote", "async"],
    remoteTypeMode: "or",
    workFromAnywhere: true
  });

  const result = applyJobFilters(jobs, filters);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Remote Full Stack Engineer");
});
