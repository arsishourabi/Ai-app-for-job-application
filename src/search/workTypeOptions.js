const WORK_TYPE_OPTIONS = Object.freeze([
  { key: "remote", label: "Remote", aliases: ["remote", "work from home"] },
  { key: "hybrid", label: "Hybrid on-site", aliases: ["hybrid", "hybrid on-site"] },
  { key: "onsite", label: "On-site", aliases: ["onsite", "on-site", "office"] },
  { key: "flexible_time", label: "Flexible time", aliases: ["flexible time", "flexible hours", "flexible schedule", "async", "asynchronous"] }
]);

function normalizeWorkType(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  const option = WORK_TYPE_OPTIONS.find((item) => item.aliases.includes(normalized) || item.key === normalized.replace(/\s+/g, "_"));
  return option ? option.key : normalized.replace(/\s+/g, "_");
}

function inferRemoteTypesFromText(...parts) {
  const text = parts.filter(Boolean).join(" ");
  const remoteTypes = new Set();

  for (const option of WORK_TYPE_OPTIONS) {
    if (option.aliases.some((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text))) {
      remoteTypes.add(option.key);
    }
  }

  return [...remoteTypes];
}

module.exports = {
  WORK_TYPE_OPTIONS,
  inferRemoteTypesFromText,
  normalizeWorkType
};
