function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
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

function absoluteUrl(value, baseUrl) {
  if (!value) return "";

  try {
    return new URL(decodeHtml(value), baseUrl).toString();
  } catch {
    return decodeHtml(value);
  }
}

module.exports = {
  absoluteUrl,
  compactText,
  decodeHtml,
  extractFirstMatch,
  stripTags
};
