const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");
const { compactText, decodeHtml, extractFirstMatch, stripTags } = require("./htmlUtils");
const { fetchSerpApiSiteJobs } = require("./serpapiSiteJobs");

const WEWORKREMOTELY_RSS_URL = "https://weworkremotely.com/categories/remote-marketing-jobs.rss";

function parseRssItems(xml) {
  return [...String(xml || "").matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
}

function readCdataOrText(item, tagName) {
  const cdata = extractFirstMatch(item, new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`, "i"));
  if (cdata) return decodeHtml(cdata);
  return decodeHtml(extractFirstMatch(item, new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i")));
}

function parseWeWorkRemotelyJobs(xml) {
  return parseRssItems(xml).map((item) => {
    const title = compactText(stripTags(readCdataOrText(item, "title")));
    const description = compactText(stripTags(readCdataOrText(item, "description")));
    const link = compactText(stripTags(readCdataOrText(item, "link")));
    const pubDate = compactText(stripTags(readCdataOrText(item, "pubDate")));

    return createJobPost({
      title,
      description,
      company: "",
      location: /anywhere|worldwide/i.test(description) ? "Anywhere in the World" : "Remote",
      source: JOB_SOURCES.WE_WORK_REMOTELY,
      date_posted: pubDate ? new Date(pubDate).toISOString() : null,
      applicant_count: null,
      job_type: /contract|freelance/i.test(`${title} ${description}`) ? ["contract"] : ["full-time"],
      remote_type: ["remote"],
      is_contractor: /contract|freelance/i.test(`${title} ${description}`),
      is_visa_sponsored: /visa|sponsor/i.test(description),
      work_from_anywhere: /anywhere|worldwide/i.test(description),
      language: "",
      apply_link: link
    });
  }).filter((job) => job.title || job.apply_link);
}

async function fetchWeWorkRemotelyJobs(searchQuery) {
  const serpJobs = await fetchSerpApiSiteJobs(searchQuery, {
    site: "weworkremotely.com",
    source: JOB_SOURCES.WE_WORK_REMOTELY,
    querySuffix: "marketing"
  });
  if (serpJobs.length) return serpJobs;

  try {
    const response = await fetch(WEWORKREMOTELY_RSS_URL);
    if (!response.ok) return [];

    const xml = await response.text();
    return parseWeWorkRemotelyJobs(xml);
  } catch {
    return [];
  }
}

module.exports = {
  WEWORKREMOTELY_RSS_URL,
  fetchWeWorkRemotelyJobs,
  parseWeWorkRemotelyJobs
};
