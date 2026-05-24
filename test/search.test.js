const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeFilters, applyJobFilters } = require("../src/filters/jobFilters");
const { aggregateJobs, detectJobLanguage } = require("../src/search");
const { generateSearchQuery } = require("../src/search/generateSearchQuery");
const { buildIndeedSearchUrls, fetchIndeedJobs } = require("../src/search/sources/indeed");
const { fetchLinkedInJobs, normalizeLinkedInApplyLink, parseApplicantCount } = require("../src/search/sources/linkedin");
const { DEFAULT_SOURCE_KEYS, SOURCE_OPTIONS, normalizeSourceKeys } = require("../src/search/sources/sourceOptions");
const { parseTelegramJobs } = require("../src/search/sources/telegram");

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

test("source options expose Telegram as an enabled default", () => {
  assert.ok(SOURCE_OPTIONS.some((source) => source.key === "telegram" && source.label === "Telegram"));
  assert.ok(DEFAULT_SOURCE_KEYS.includes("telegram"));
  assert.deepEqual(normalizeSourceKeys(["linkedin", "telegram", "unknown"]), ["linkedin", "telegram"]);
  assert.ok(normalizeFilters({ role: "Engineer" }).sources.includes("telegram"));
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

test("LinkedIn adapter uses SerpApi google_jobs with a LinkedIn site query", async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.SERPAPI_API_KEY;
  process.env.SERPAPI_API_KEY = "test-key";

  global.fetch = async (url) => {
    assert.equal(url.searchParams.get("engine"), "google_jobs");
    assert.equal(url.searchParams.get("q"), `"Backend Engineer" site:linkedin.com`);
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
              link: "https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4411376096"
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
    assert.equal(jobs[0].apply_link, "https://www.linkedin.com/jobs/search/?currentJobId=4411376096");
  } finally {
    global.fetch = originalFetch;
    process.env.SERPAPI_API_KEY = originalApiKey;
  }
});

test("LinkedIn apply links are rewritten to public guest job URLs", () => {
  assert.equal(
    normalizeLinkedInApplyLink("https://www.linkedin.com/jobs/view/digital-marketing-manager-at-digital-waffle-4411376096"),
    "https://www.linkedin.com/jobs/search/?currentJobId=4411376096"
  );
  assert.equal(
    normalizeLinkedInApplyLink("https://www.linkedin.com/jobs/search/?currentJobId=4411376096"),
    "https://www.linkedin.com/jobs/search/?currentJobId=4411376096"
  );
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

test("detectJobLanguage identifies common Turkish, German, and English content", () => {
  assert.equal(detectJobLanguage("Backend Gelistirici", "Uzaktan calisma ve esnek saatler için ekip ariyoruz"), "tr");
  assert.equal(detectJobLanguage("Software Entwickler", "Vollzeit mit Deutsch und Englisch"), "de");
  assert.equal(detectJobLanguage("Remote Backend Engineer", "Build APIs for global teams"), "en");
});

test("language filter accepts a multi-select array with OR matching", () => {
  const filters = normalizeFilters({
    role: "Engineer",
    languages: ["en", "tr"]
  });
  const result = applyJobFilters(
    [
      { title: "English role", language: "en", job_type: [], remote_type: [] },
      { title: "Turkish role", language: "tr", job_type: [], remote_type: [] },
      { title: "German role", language: "de", job_type: [], remote_type: [] }
    ],
    filters
  );

  assert.deepEqual(
    result.map((job) => job.title),
    ["English role", "Turkish role"]
  );
});

test("aggregator detects missing job language before filtering", async () => {
  const filters = normalizeFilters({
    role: "Backend",
    languages: ["tr"],
    sources: ["indeed"]
  });
  const originalProxy = process.env.INDEED_JOBS_API_URL;
  const originalFetch = global.fetch;
  process.env.INDEED_JOBS_API_URL = "https://example.test/indeed";
  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        jobs: [
          {
            title: "Backend Gelistirici",
            company: "Acme",
            location: "Istanbul",
            description: "Uzaktan calisma ve ekip ile urun gelistirme",
            apply_link: "https://example.test/apply"
          }
        ]
      };
    }
  });

  try {
    const result = await aggregateJobs(filters);
    assert.equal(result.total, 1);
    assert.equal(result.jobs[0].language, "tr");
  } finally {
    global.fetch = originalFetch;
    process.env.INDEED_JOBS_API_URL = originalProxy;
  }
});

test("Telegram source parses public channel preview messages", () => {
  const jobs = parseTelegramJobs(`
    <div class="tgme_widget_message" data-post="remotejobss/123">
      <div class="tgme_widget_message_text js-message_text" dir="auto">
        Remote Backend Engineer<br>
        Build APIs from anywhere.<br>
        <a href="https://example.com/apply">Apply here</a>
      </div>
      <time datetime="2026-05-24T10:00:00+00:00"></time>
    </div></div>
  `);

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].source, "Telegram");
  assert.equal(jobs[0].title, "Remote Backend Engineer");
  assert.equal(jobs[0].apply_link, "https://example.com/apply");
  assert.equal(jobs[0].date_posted, "2026-05-24T10:00:00+00:00");
  assert.deepEqual(jobs[0].remote_type, ["remote"]);
});
