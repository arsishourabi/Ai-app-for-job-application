const { fetchGoogleJobs } = require("./google");
const { fetchIndeedJobs } = require("./indeed");
const { fetchLinkedInJobs } = require("./linkedin");
const { fetchTelegramJobs } = require("./telegram");

const sourceAdapters = {
  google: fetchGoogleJobs,
  indeed: fetchIndeedJobs,
  linkedin: fetchLinkedInJobs,
  telegram: fetchTelegramJobs
};

module.exports = {
  sourceAdapters
};
