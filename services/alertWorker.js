const { fetchActiveAlerts, updateAlertNotificationState } = require("../src/alerts/alertStore");
const { sendJobAlertEmail } = require("../src/email/sendJobAlertEmail");
const { aggregateJobs } = require("../src/search");

function getJobTimestamp(job) {
  const timestamp = Date.parse(job.date_posted || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isNewJob(job, cutoffIso) {
  if (!cutoffIso) return true;
  return getJobTimestamp(job) > Date.parse(cutoffIso);
}

function getNotificationCutoff(alert) {
  return alert.last_notified_at || alert.created_at || null;
}

async function processAlert(alert) {
  const result = await aggregateJobs(alert.filters);
  const cutoff = getNotificationCutoff(alert);
  const newJobs = result.jobs.filter((job) => isNewJob(job, cutoff));

  if (!newJobs.length) {
    return {
      alert_id: alert.id,
      email: alert.email,
      checked: result.jobs.length,
      notified: 0
    };
  }

  const emailResult = await sendJobAlertEmail(alert.email, newJobs);
  const newestTimestamp = newJobs
    .map(getJobTimestamp)
    .filter(Boolean)
    .sort((a, b) => b - a)[0];
  const lastNotifiedAt = newestTimestamp ? new Date(newestTimestamp).toISOString() : new Date().toISOString();

  await updateAlertNotificationState(alert.id, lastNotifiedAt);

  return {
    alert_id: alert.id,
    email: alert.email,
    checked: result.jobs.length,
    notified: newJobs.length,
    email_result: emailResult
  };
}

async function runAlertWorker() {
  const alerts = await fetchActiveAlerts();
  const results = [];

  for (const alert of alerts) {
    try {
      results.push(await processAlert(alert));
    } catch (error) {
      results.push({
        alert_id: alert.id,
        email: alert.email,
        error: error.message
      });
    }
  }

  return {
    checked_at: new Date().toISOString(),
    alerts_checked: alerts.length,
    results
  };
}

if (require.main === module) {
  runAlertWorker()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = {
  processAlert,
  runAlertWorker
};
