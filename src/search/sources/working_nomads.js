const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");
const { absoluteUrl, compactText, extractFirstMatch, stripTags } = require("./htmlUtils");

const WORKING_NOMADS_URLS = Object.freeze([
  "https://www.workingnomads.com/remote-marketing-jobs",
  "https://www.workingnomads.com/remote-development-jobs"
]);

function extractWorkingNomadsCards(html) {
  return [...String(html || "").matchAll(/<a\b[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      href: match[1],
      html: match[2],
      text: compactText(stripTags(match[2]))
    }))
    .filter((card) => /job|remote|marketing|developer|engineer|media|buyer|anywhere/i.test(`${card.href} ${card.text}`));
}

function parseWorkingNomadsJobs(html) {
  const seen = new Set();

  return extractWorkingNomadsCards(html)
    .map((card) => {
      const heading = extractFirstMatch(card.html, /<(?:h2|h3|h4|strong|span)[^>]*>([\s\S]*?)<\/(?:h2|h3|h4|strong|span)>/i);
      const title = compactText(stripTags(heading)) || card.text.split("\n")[0] || card.text;
      const description = card.text;
      const applyLink = absoluteUrl(card.href, "https://www.workingnomads.com");

      return createJobPost({
        title: title.slice(0, 180),
        description,
        company: "",
        location: /worldwide|anywhere|global/i.test(description) ? "Anywhere" : "Remote",
        source: JOB_SOURCES.WORKING_NOMADS,
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

async function fetchWorkingNomadsJobs() {
  try {
    const pages = await Promise.all(
      WORKING_NOMADS_URLS.map(async (url) => {
        const response = await fetch(url);
        return response.ok ? response.text() : "";
      })
    );

    return pages.flatMap(parseWorkingNomadsJobs);
  } catch {
    return [];
  }
}

module.exports = {
  WORKING_NOMADS_URLS,
  fetchWorkingNomadsJobs,
  parseWorkingNomadsJobs
};
