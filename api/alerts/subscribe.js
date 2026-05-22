const { insertAlert } = require("../../src/alerts/alertStore");
const { validateAlertSubscription } = require("../../src/alerts/alertValidation");

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody.trim()) return {};
  return JSON.parse(rawBody);
}

async function subscribeHandler(req, res) {
  if (req.method && req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const validation = validateAlertSubscription(body);

    if (!validation.valid) {
      sendJson(res, 400, { error: "Invalid alert subscription", details: validation.errors });
      return;
    }

    const alert = await insertAlert({
      email: validation.email,
      filters: validation.filters
    });

    sendJson(res, 201, {
      alert: {
        id: alert.id,
        email: alert.email,
        filters: alert.filters,
        created_at: alert.created_at,
        last_notified_at: alert.last_notified_at
      }
    });
  } catch (error) {
    sendJson(res, 500, {
      error: "Unable to create job alert",
      detail: error.message
    });
  }
}

module.exports = subscribeHandler;
module.exports.default = subscribeHandler;
module.exports.subscribeHandler = subscribeHandler;
