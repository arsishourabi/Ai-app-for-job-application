const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");

function readGoogleOrganicResults(payload) {
  return Array.isArray(payload.organic_results) ? payload.organic_results : [];
}

function readLinkedInPostApplyLink(post) {
  const text = `${post.title || ""} ${post.snippet || ""}`;
  const directLink = text.match(/https?:\/\/[^\s)]+/i);
  if (directLink && !directLink[0].includes("linkedin.com")) return directLink[0];
  return post.link || "";
}

function inferLinkedInPostTitle(post) {
  const text = `${post.title || ""} ${post.snippet || ""}`;
  const roleMatch = text.match(/\b(remote roles?|remote jobs?|hiring[:\s-]+[^.|\n]+|(?:media buyer|marketer|designer|developer|engineer)[^.|\n]*)/i);
  if (roleMatch) return roleMatch[0].replace(/^hiring[:\s-]*/i, "").trim();
  return post.title || "LinkedIn Feed Role";
}

function mapLinkedInPost(post) {
  const description = [post.title, post.snippet].filter(Boolean).join("\n");

  return createJobPost({
    title: inferLinkedInPostTitle(post).slice(0, 180),
    description,
    company: "",
    location: /worldwide|global|anywhere/i.test(description) ? "Worldwide" : "Remote",
    source: JOB_SOURCES.LINKEDIN_FEED,
    date_posted: null,
    applicant_count: null,
    job_type: /contract|freelance/i.test(description) ? ["contract"] : [],
    remote_type: ["remote"],
    is_contractor: /contract|freelance/i.test(description),
    is_visa_sponsored: /visa|sponsor/i.test(description),
    work_from_anywhere: /worldwide|global|anywhere/i.test(description),
    language: "",
    apply_link: readLinkedInPostApplyLink(post)
  });
}

function parseLinkedInPosts(payload) {
  return readGoogleOrganicResults(payload)
    .filter((post) => /linkedin\.com\/posts\//i.test(post.link || ""))
    .filter((post) => /remote|hiring|job|role|apply|media buyer|marketer|developer|engineer/i.test(`${post.title || ""} ${post.snippet || ""}`))
    .map(mapLinkedInPost);
}

async function fetchLinkedInFeedJobs(searchQuery) {
  if (!process.env.SERPAPI_API_KEY) {
    return [];
  }

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", `"${searchQuery.role} remote roles" site:linkedin.com/posts`);
    url.searchParams.set("api_key", process.env.SERPAPI_API_KEY);

    const response = await fetch(url);
    if (!response.ok) return [];

    const payload = await response.json();
    return parseLinkedInPosts(payload);
  } catch {
    return [];
  }
}

module.exports = {
  fetchLinkedInFeedJobs,
  mapLinkedInPost,
  parseLinkedInPosts,
  readGoogleOrganicResults
};
