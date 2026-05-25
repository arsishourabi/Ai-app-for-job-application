const { fetchDynamiteJobs } = require("./dynamite_jobs");
const { fetchGoogleJobs } = require("./google");
const { fetchIndeedJobs } = require("./indeed");
const { fetchLinkedInJobs } = require("./linkedin");
const { fetchRemoteCoJobs } = require("./remoteco");
const { fetchTelegramJobs } = require("./telegram");
const { fetchWeWorkRemotelyJobs } = require("./weworkremotely");
const { ALLOWED_SOURCE_KEYS, DEFAULT_SOURCE_KEYS, SOURCE_OPTIONS } = require("./sourceOptions");

const sourceAdapters = {
  google: fetchGoogleJobs,
  indeed: fetchIndeedJobs,
  linkedin: fetchLinkedInJobs,
  telegram: fetchTelegramJobs,
  dynamite_jobs: fetchDynamiteJobs,
  weworkremotely: fetchWeWorkRemotelyJobs,
  remoteco: fetchRemoteCoJobs
};

module.exports = {
  ALLOWED_SOURCE_KEYS,
  DEFAULT_SOURCE_KEYS,
  SOURCE_OPTIONS,
  sourceAdapters
};
