function generateSearchQuery({ role, location = "Worldwide" }) {
  if (!role || !String(role).trim()) {
    throw new Error("Role is required to generate a search query.");
  }

  const normalizedRole = String(role).trim();
  const normalizedLocation = String(location || "Worldwide").trim() || "Worldwide";
  const locationClause = normalizedLocation.toLowerCase() === "worldwide" ? "" : ` ${normalizedLocation}`;

  return {
    role: normalizedRole,
    location: normalizedLocation,
    text: `${normalizedRole}${locationClause}`.trim(),
    linkedIn: {
      keywords: normalizedRole,
      location: normalizedLocation,
      applicant_count_max: 9
    },
    indeed: {
      query: normalizedRole,
      location: normalizedLocation,
      hostnames: ["www.indeed.com", "uk.indeed.com", "ca.indeed.com", "tr.indeed.com", "de.indeed.com", "fr.indeed.com", "au.indeed.com", "in.indeed.com"]
    },
    google: {
      engine: "google_jobs",
      query: `${normalizedRole} jobs${locationClause}`.trim()
    }
  };
}

module.exports = {
  generateSearchQuery
};
