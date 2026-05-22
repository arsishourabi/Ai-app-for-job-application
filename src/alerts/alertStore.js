const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const ALERT_STORE_PATH = process.env.JOB_ALERT_STORE_PATH || path.join(process.cwd(), "data", "job_alerts.json");

async function ensureStore() {
  await fs.mkdir(path.dirname(ALERT_STORE_PATH), { recursive: true });

  try {
    await fs.access(ALERT_STORE_PATH);
  } catch {
    await fs.writeFile(ALERT_STORE_PATH, "[]\n", "utf8");
  }
}

async function readAlerts() {
  await ensureStore();
  const content = await fs.readFile(ALERT_STORE_PATH, "utf8");
  if (!content.trim()) return [];
  return JSON.parse(content);
}

async function writeAlerts(alerts) {
  await fs.mkdir(path.dirname(ALERT_STORE_PATH), { recursive: true });
  await fs.writeFile(ALERT_STORE_PATH, `${JSON.stringify(alerts, null, 2)}\n`, "utf8");
}

function createAlertRecord({ email, filters }) {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    email,
    filters,
    created_at: timestamp,
    last_notified_at: null,
    active: true
  };
}

async function insertAlert(input) {
  const alerts = await readAlerts();
  const alert = createAlertRecord(input);
  alerts.push(alert);
  await writeAlerts(alerts);
  return alert;
}

async function fetchActiveAlerts() {
  const alerts = await readAlerts();
  return alerts.filter((alert) => alert.active !== false);
}

async function updateAlertNotificationState(id, lastNotifiedAt) {
  const alerts = await readAlerts();
  const index = alerts.findIndex((alert) => alert.id === id);
  if (index === -1) return null;

  alerts[index] = {
    ...alerts[index],
    last_notified_at: lastNotifiedAt
  };

  await writeAlerts(alerts);
  return alerts[index];
}

module.exports = {
  ALERT_STORE_PATH,
  fetchActiveAlerts,
  insertAlert,
  readAlerts,
  updateAlertNotificationState
};
