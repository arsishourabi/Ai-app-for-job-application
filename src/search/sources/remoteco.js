const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");
const { absoluteUrl, compactText, extractFirstMatch, stripTags } = require("./htmlUtils");
const { fetchSerpApiSiteJobs } = require("./serpapiSiteJobs");

const REMOTECO_MARKETING_URL = "https://remote.co/remote-jobs/marketing";

function extractRemoteCoCards(html) {
  const links = [...String(html || "").matchAll(/<a\b[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      href: match[1],
      html: match[2],
      text: compactText(stripTags(match[2]))
    }));

  return links.filter((link) => /remote-jobs\/.+|\/job\//i.test(link.href) && link.text.length > 8);
}

function parseRemoteCoJobs(html) {
  const seen = new Set();

  return extractRemoteCoCards(html)
    .map((card) => {
      const title = compactText(stripTags(
        extractFirstMatch(card.html, /<(?:h2|h3|span|strong)[^>]*>([\s\S]*?)<\/(?:h2|h3|span|strong)>/i)
      )) || card.text.split("\n")[0] || card.text;
      const applyLink = absoluteUrl(card.href, "https://remote.co");

      return createJobPost({
        title: title.slice(0, 180),
        description: card.text,
        company: "",
        location: "Remote",
        source: JOB_SOURCES.REMOTE_CO,
        date_posted: null,
        applicant_count: null,
        job_type: /contract|freelance/i.test(card.text) ? ["contract"] : [],
        remote_type: ["remote"],
        is_contractor: /contract|freelance/i.test(card.text),
        is_visa_sponsored: /visa|sponsor/i.test(card.text),
        work_from_anywhere: /anywhere|worldwide/i.test(card.text),
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

async function fetchRemoteCoJobs(searchQuery) {
  const serpJobs = await fetchSerpApiSiteJobs(searchQuery, {
    site: "remote.co",
    source: JOB_SOURCES.REMOTE_CO,
    querySuffix: "marketing media buyer"
  });
  if (serpJobs.length) return serpJobs;

  try {
    const response = await fetch(REMOTECO_MARKETING_URL);
    if (!response.ok) return [];

    const html = await response.text();
    return parseRemoteCoJobs(html);
  } catch {
    return [];
  }
}

module.exports = {
  REMOTECO_MARKETING_URL,
  fetchRemoteCoJobs,
  parseRemoteCoJobs
};
