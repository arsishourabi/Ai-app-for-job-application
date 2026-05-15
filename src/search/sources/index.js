const { fetchGoogleJobs } = require("./google");
const { fetchIndeedJobs } = require("./indeed");
const { fetchLinkedInJobs } = require("./linkedin");

const sourceAdapters = {
  google: fetchGoogleJobs,
  indeed: fetchIndeedJobs,
  linkedin: fetchLinkedInJobs
};

module.exports = {
  sourceAdapters
};
