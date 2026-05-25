const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");
const { absoluteUrl, compactText, extractFirstMatch, stripTags } = require("./htmlUtils");

const JS_REMOTELY_URL = "https://javascript.jobs/remote";

function extractJsRemotelyCards(html) {
  return [...String(html || "").matchAll(/<a\b[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      href: match[1],
      html: match[2],
      text: compactText(stripTags(match[2]))
    }))
    .filter((card) => /job|remote|javascript|typescript|react|node|developer|engineer/i.test(`${card.href} ${card.text}`));
}

function parseJsRemotelyJobs(html) {
  const seen = new Set();

  return extractJsRemotelyCards(html)
    .map((card) => {
      const heading = extractFirstMatch(card.html, /<(?:h2|h3|h4|strong|span)[^>]*>([\s\S]*?)<\/(?:h2|h3|h4|strong|span)>/i);
      const title = compactText(stripTags(heading)) || card.text.split("\n")[0] || card.text;
      const description = card.text;
      const applyLink = absoluteUrl(card.href, "https://javascript.jobs");

      return createJobPost({
        title: title.slice(0, 180),
        description,
        company: "",
        location: /worldwide|anywhere|global/i.test(description) ? "Worldwide" : "Remote",
        source: JOB_SOURCES.JS_REMOTELY,
        date_posted: null,
        applicant_count: null,
        job_type: /contract|freelance/i.test(description) ? ["contract"] : [],
        remote_type: ["remote"],
        is_contractor: /contract|freelance/i.test(description),
        is_visa_sponsored: /visa|sponsor/i.test(description),
        work_from_anywhere: /worldwide|anywhere|global/i.test(description),
        language: "",
        apply_link: applyLink
      });
    })
    .filter((job) => {
      const key = `${job.title}|${job.apply_link}`;
      if (!job.title || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function fetchJsRemotelyJobs() {
  try {
    const response = await fetch(JS_REMOTELY_URL);
    if (!response.ok) return [];

    const html = await response.text();
    return parseJsRemotelyJobs(html);
  } catch {
    return [];
  }
}

module.exports = {
  JS_REMOTELY_URL,
  fetchJsRemotelyJobs,
  parseJsRemotelyJobs
};
