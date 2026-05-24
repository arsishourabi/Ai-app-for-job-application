const { fetchGoogleJobs } = require("./google");
const { fetchIndeedJobs } = require("./indeed");
const { fetchLinkedInJobs } = require("./linkedin");
const { fetchTelegramJobs } = require("./telegram");
const { ALLOWED_SOURCE_KEYS, DEFAULT_SOURCE_KEYS, SOURCE_OPTIONS } = require("./sourceOptions");

const sourceAdapters = {
  google: fetchGoogleJobs,
  indeed: fetchIndeedJobs,
  linkedin: fetchLinkedInJobs,
  telegram: fetchTelegramJobs
};

module.exports = {
  ALLOWED_SOURCE_KEYS,
  DEFAULT_SOURCE_KEYS,
  SOURCE_OPTIONS,
  sourceAdapters
};
