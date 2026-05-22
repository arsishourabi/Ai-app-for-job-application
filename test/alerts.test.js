const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAlertSubscription } = require("../src/alerts/alertValidation");
const { buildJobAlertEmail } = require("../src/email/sendJobAlertEmail");

test("alert subscription validates email and normalizes snake_case filters", () => {
  const result = validateAlertSubscription({
    email: "USER@example.COM",
    filters: {
      role: "Backend Engineer",
      location: "Remote",
      job_type: ["Full-Time"],
      remote_type: "Remote",
      visa_sponsorship: true,
      under_10_applicants: "true",
      language: "EN"
    }
  });

  assert.equal(result.valid, true);
  assert.equal(result.email, "user@example.com");
  assert.equal(result.filters.role, "Backend Engineer");
  assert.deepEqual(result.filters.jobType, ["full-time"]);
  assert.deepEqual(result.filters.remoteType, ["remote"]);
  assert.equal(result.filters.isVisaSponsored, true);
  assert.equal(result.filters.under10Applicants, true);
  assert.equal(result.filters.language, "en");
});

test("alert subscription rejects invalid requests", () => {
  const result = validateAlertSubscription({
    email: "not-an-email",
    filters: { location: "Worldwide" }
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 2);
});

test("job alert email renderer includes digest jobs", () => {
  const email = buildJobAlertEmail("user@example.com", [
    {
      title: "Backend Engineer",
      company: "Acme",
      location: "Remote",
      source: "Google",
      date_posted: "2026-05-22T00:00:00.000Z",
      apply_link: "https://example.com/apply"
    }
  ]);

  assert.match(email.subject, /1 new job/);
  assert.match(email.html, /Backend Engineer/);
  assert.match(email.text, /Acme/);
});
