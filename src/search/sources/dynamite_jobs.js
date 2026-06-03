const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");
const { absoluteUrl, compactText, extractFirstMatch, stripTags } = require("./htmlUtils");
const { fetchSerpApiSiteJobs } = require("./serpapiSiteJobs");

const DYNAMITE_JOBS_URL = "https://dynamitejobs.com/remote-jobs?text=marketing%20media%20buyer";

function extractJobCards(html) {
  const cards = [...String(html || "").matchAll(/<a\b[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      href: match[1],
      html: match[2],
      text: compactText(stripTags(match[2]))
    }));

  return cards.filter((card) => /job|remote|marketing|media buyer|growth|paid/i.test(`${card.href} ${card.text}`));
}

function parseDynamiteJobs(html) {
  const seen = new Set();

  return extractJobCards(html)
    .map((card) => {
      const title = extractFirstMatch(card.html, /<(?:h2|h3|h4|strong)[^>]*>([\s\S]*?)<\/(?:h2|h3|h4|strong)>/i)
        ? compactText(stripTags(extractFirstMatch(card.html, /<(?:h2|h3|h4|strong)[^>]*>([\s\S]*?)<\/(?:h2|h3|h4|strong)>/i)))
        : card.text.split("\n")[0] || card.text;
      const applyLink = absoluteUrl(card.href, "https://dynamitejobs.com");

      return createJobPost({
        title: title.slice(0, 180),
        description: card.text,
        company: "",
        location: /worldwide|anywhere/i.test(card.text) ? "Anywhere in the World" : "Remote",
        source: JOB_SOURCES.DYNAMITE_JOBS,
        date_posted: null,
        applicant_count: null,
        job_type: /contract|freelance/i.test(card.text) ? ["contract"] : [],
        remote_type: ["remote"],
        is_contractor: /contract|freelance/i.test(card.text),
        is_visa_sponsored: /visa|sponsor/i.test(card.text),
        work_from_anywhere: /worldwide|anywhere/i.test(card.text),
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

async function fetchDynamiteJobs(searchQuery) {
  const serpJobs = await fetchSerpApiSiteJobs(searchQuery, {
    site: "dynamitejobs.com",
    source: JOB_SOURCES.DYNAMITE_JOBS,
    querySuffix: "marketing media buyer"
  });
  if (serpJobs.length) return serpJobs;

  try {
    const response = await fetch(DYNAMITE_JOBS_URL);
    if (!response.ok) return [];

    const html = await response.text();
    return parseDynamiteJobs(html);
  } catch {
    return [];
  }
}

module.exports = {
  DYNAMITE_JOBS_URL,
  fetchDynamiteJobs,
  parseDynamiteJobs
};
