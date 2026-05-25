const { fetchDynamiteJobs } = require("./dynamite_jobs");
const { fetchGoogleJobs } = require("./google");
const { fetchIndeedJobs } = require("./indeed");
const { fetchJobspressoJobs } = require("./jobspresso");
const { fetchJsRemotelyJobs } = require("./js_remotely");
const { fetchLinkedInJobs } = require("./linkedin");
const { fetchRemoteCoJobs } = require("./remoteco");
const { fetchTelegramJobs } = require("./telegram");
const { fetchWeWorkRemotelyJobs } = require("./weworkremotely");
const { fetchWorkingNomadsJobs } = require("./working_nomads");
const { ALLOWED_SOURCE_KEYS, DEFAULT_SOURCE_KEYS, SOURCE_OPTIONS } = require("./sourceOptions");

const sourceAdapters = {
  google: fetchGoogleJobs,
  indeed: fetchIndeedJobs,
  linkedin: fetchLinkedInJobs,
  telegram: fetchTelegramJobs,
  dynamite_jobs: fetchDynamiteJobs,
  weworkremotely: fetchWeWorkRemotelyJobs,
  remoteco: fetchRemoteCoJobs,
  jobspresso: fetchJobspressoJobs,
  working_nomads: fetchWorkingNomadsJobs,
  js_remotely: fetchJsRemotelyJobs
};

module.exports = {
  ALLOWED_SOURCE_KEYS,
  DEFAULT_SOURCE_KEYS,
  SOURCE_OPTIONS,
  sourceAdapters
};
