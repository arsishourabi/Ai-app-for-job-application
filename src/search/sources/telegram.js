const { JOB_SOURCES, createJobPost } = require("../../schema/jobPost");

const TELEGRAM_CHANNEL = "remotejobss";
const TELEGRAM_PREVIEW_URL = `https://t.me/s/${TELEGRAM_CHANNEL}`;

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
}

function compactText(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function extractFirstMatch(value, pattern) {
  const match = String(value || "").match(pattern);
  return match ? match[1] : "";
}

function extractMessageBlocks(html) {
  return [...String(html || "").matchAll(/<div class="tgme_widget_message\b[\s\S]*?<\/time>[\s\S]*?<\/div>\s*<\/div>/gi)].map((match) => match[0]);
}

function extractMessageText(block) {
  return extractFirstMatch(block, /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
}

function extractPostUrl(block) {
  return extractFirstMatch(block, /data-post="remotejobss\/(\d+)"/i)
    ? `https://t.me/${TELEGRAM_CHANNEL}/${extractFirstMatch(block, /data-post="remotejobss\/(\d+)"/i)}`
    : "";
}

function extractTimestamp(block) {
  return extractFirstMatch(block, /<time[^>]+datetime="([^"]+)"/i);
}

function extractExternalLink(messageHtml) {
  const links = [...String(messageHtml || "").matchAll(/href="(https?:\/\/[^"]+)"/gi)]
    .map((match) => decodeHtml(match[1]))
    .filter((link) => !link.includes("t.me/"));

  return links[0] || "";
}

function parseTelegramMessage(block) {
  const messageHtml = extractMessageText(block);
  const description = compactText(stripTags(messageHtml));
  if (!description) return null;

  const firstLine = description.split("\n")[0];
  const postUrl = extractPostUrl(block);

  return createJobPost({
    title: firstLine.slice(0, 140),
    description,
    company: "",
    location: "",
    source: JOB_SOURCES.TELEGRAM,
    date_posted: extractTimestamp(block) || null,
    applicant_count: null,
    job_type: [],
    remote_type: /remote|work from home|anywhere/i.test(description) ? ["remote"] : [],
    is_contractor: /contract|contractor|freelance/i.test(description),
    is_visa_sponsored: /visa|sponsor/i.test(description),
    work_from_anywhere: /worldwide|anywhere|work from anywhere/i.test(description),
    language: "",
    apply_link: extractExternalLink(messageHtml) || postUrl
  });
}

function parseTelegramJobs(html) {
  return extractMessageBlocks(html)
    .map(parseTelegramMessage)
    .filter(Boolean);
}

async function fetchTelegramJobs() {
  const response = await fetch(TELEGRAM_PREVIEW_URL);
  if (!response.ok) {
    throw new Error(`Telegram source failed with status ${response.status}`);
  }

  const html = await response.text();
  return parseTelegramJobs(html);
}

module.exports = {
  TELEGRAM_PREVIEW_URL,
  fetchTelegramJobs,
  parseTelegramJobs
};
