# Multi-Source Job Aggregator Backend

Modular backend scaffold for searching and filtering job posts across LinkedIn, Indeed, Google Jobs, and future sources.

## Endpoint

`GET /api/jobs`

Required query parameter:

- `role`: target role or title.

Optional query parameters:

- `location`: defaults to `Worldwide`.
- `job_type`: comma-separated list, for example `full-time,contract`.
- `job_type_mode`: `and` or `or`.
- `remote_type`: comma-separated list, for example `remote,async`.
- `remote_type_mode`: `and` or `or`.
- `work_from_anywhere`: boolean flag for residency-free roles.
- `is_contractor`: boolean.
- `is_visa_sponsored`: boolean.
- `language`: language code, for example `en`.
- `sources`: comma-separated source keys, for example `linkedin,indeed,google`.

Example:

```text
/api/jobs?role=Backend%20Engineer&location=Worldwide&remote_type=remote,async&remote_type_mode=or&work_from_anywhere=true
```

`POST /api/alerts/subscribe`

Creates a saved job alert in `data/job_alerts.json` using this shape:

```json
{
  "email": "user@example.com",
  "filters": {
    "role": "Backend Engineer",
    "location": "Worldwide",
    "job_type": ["full-time"],
    "remote_type": ["remote"],
    "under_10_applicants": true,
    "visa_sponsorship": true,
    "language": "en",
    "sources": ["linkedin", "indeed", "google"]
  }
}
```

The equivalent relational schema is in `db/job_alerts.sql`.

## Alert Worker

Run the worker hourly from cron, GitHub Actions, Vercel Cron, or a Supabase Edge Function wrapper:

```text
node services/alertWorker.js
```

The worker loads active alerts, runs the existing multi-source aggregator for each alert's filters, compares results against `last_notified_at`, sends an email digest when fresh jobs are available, then updates the alert timestamp. Configure `RESEND_API_KEY` or `SENDGRID_API_KEY` plus `ALERT_EMAIL_FROM` to enable real email delivery; otherwise it logs a safe preview.

## JobPost Schema

Every adapter returns this shape:

```json
{
  "title": "string",
  "company": "string",
  "location": "string",
  "source": "LinkedIn | Google | Indeed | string",
  "date_posted": "ISO-8601 date string",
  "applicant_count": 0,
  "job_type": ["full-time"],
  "remote_type": ["remote"],
  "is_contractor": false,
  "is_visa_sponsored": false,
  "work_from_anywhere": false,
  "language": "en",
  "apply_link": "https://example.com/apply"
}
```

## Source Hooks

The first source adapters are dependency-free and return empty lists until API credentials or proxy endpoints are configured:

- `LINKEDIN_JOBS_API_URL`: expected to accept `keywords`, `location`, and `applicant_count_max=9`.
- `INDEED_JOBS_API_URL`: expected to accept a `search_url` parameter. The adapter iterates global Indeed hosts.
- `SERPAPI_API_KEY`: enables the Google Jobs Search API style adapter through SerpApi.

To add another source, create a file in `src/search/sources`, normalize results through `createJobPost`, then register the adapter in `src/search/sources/index.js`.
