const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeFilters, applyJobFilters } = require("../src/filters/jobFilters");
const { generateSearchQuery } = require("../src/search/generateSearchQuery");
const { buildIndeedSearchUrls, fetchIndeedJobs } = require("../src/search/sources/indeed");
const { fetchLinkedInJobs, parseApplicantCount } = require("../src/search/sources/linkedin");

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

test("under 10 applicant filter excludes unknown and crowded jobs", () => {
  const filters = normalizeFilters({
    role: "Engineer",
    under_10_applicants: true
  });
  const result = applyJobFilters(
    [
      { title: "Low applicant role", applicant_count: 4, job_type: [], remote_type: [] },
      { title: "Unknown applicant role", applicant_count: null, job_type: [], remote_type: [] },
      { title: "Crowded role", applicant_count: 25, job_type: [], remote_type: [] }
    ],
    filters
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Low applicant role");
});

test("LinkedIn adapter uses SerpApi linkedin_jobs and maps applicants", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.SERPAPI_API_KEY;
  process.env.SERPAPI_API_KEY = "test-key";

  global.fetch = async (url) => {
    assert.equal(url.searchParams.get("engine"), "linkedin_jobs");
    assert.equal(url.searchParams.get("q"), "Backend Engineer");
    assert.equal(url.searchParams.get("location"), "Istanbul");
    assert.equal(url.searchParams.get("api_key"), "test-key");

    return {
      ok: true,
      async json() {
        return {
          jobs_results: [
            {
              title: "Backend Engineer",
              company_name: "Acme",
              location: "Istanbul",
              detected_extensions: {
                posted_at: "2026-05-22T00:00:00.000Z",
                applicants: "7 applicants"
              },
              link: "https://linkedin.com/jobs/view/123"
            }
          ]
        };
      }
    };
  };

  try {
    const jobs = await fetchLinkedInJobs(generateSearchQuery({ role: "Backend Engineer", location: "Istanbul" }));
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].source, "LinkedIn");
    assert.equal(jobs[0].applicant_count, 7);
    assert.equal(jobs[0].apply_link, "https://linkedin.com/jobs/view/123");
  } finally {
    global.fetch = originalFetch;
    process.env.SERPAPI_API_KEY = originalApiKey;
  }
});

test("LinkedIn applicant parser handles numeric text", () => {
  assert.equal(parseApplicantCount("7 applicants"), 7);
  assert.equal(parseApplicantCount("Over 100 applicants"), 100);
  assert.equal(parseApplicantCount(null), null);
});

test("Indeed returns temporary mock jobs without a proxy URL", async () => {
  const originalProxy = process.env.INDEED_JOBS_API_URL;
  delete process.env.INDEED_JOBS_API_URL;

  try {
    const jobs = await fetchIndeedJobs(generateSearchQuery({ role: "Designer", location: "Remote" }));
    assert.equal(jobs.length, 3);
    assert.ok(jobs.every((job) => job.source === "Indeed"));
    assert.ok(jobs.every((job) => job.is_mock));
  } finally {
    process.env.INDEED_JOBS_API_URL = originalProxy;
  }
});
