function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderJobList(jobs) {
  return jobs
    .map((job) => {
      const title = escapeHtml(job.title || "Untitled role");
      const company = escapeHtml(job.company || "Unknown company");
      const location = escapeHtml(job.location || "Location not listed");
      const source = escapeHtml(job.source || "Job source");
      const datePosted = job.date_posted ? escapeHtml(new Date(job.date_posted).toLocaleDateString("en-US")) : "Fresh listing";
      const applyLink = escapeHtml(job.apply_link || "#");

      return `
        <tr>
          <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <div style="font-size:16px;font-weight:700;color:#111827;">${title}</div>
            <div style="margin-top:4px;color:#374151;">${company} · ${location}</div>
            <div style="margin-top:8px;color:#6b7280;font-size:13px;">${source} · ${datePosted}</div>
            <a href="${applyLink}" style="display:inline-block;margin-top:12px;padding:9px 12px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View job</a>
          </td>
        </tr>`;
    })
    .join("");
}

function buildJobAlertEmail(userEmail, jobsList) {
  const subject = `${jobsList.length} new job${jobsList.length === 1 ? "" : "s"} matching your alert`;
  const html = `
    <div style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:24px;border-bottom:1px solid #e5e7eb;">
            <div style="font-size:22px;font-weight:800;">New job matches</div>
            <div style="margin-top:6px;color:#4b5563;">We found fresh listings for ${escapeHtml(userEmail)}.</div>
          </td>
        </tr>
        ${renderJobList(jobsList)}
      </table>
    </div>`;

  const text = jobsList
    .map((job) => `${job.title || "Untitled role"} at ${job.company || "Unknown company"} - ${job.apply_link || "No apply link"}`)
    .join("\n");

  return { subject, html, text };
}

async function sendWithResend(userEmail, email) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM || "Job Alerts <alerts@example.com>",
      to: userEmail,
      subject: email.subject,
      html: email.html,
      text: email.text
    })
  });

  if (!response.ok) {
    throw new Error(`Resend email failed with status ${response.status}`);
  }
}

async function sendWithSendGrid(userEmail, email) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: userEmail }] }],
      from: { email: process.env.ALERT_EMAIL_FROM || "alerts@example.com" },
      subject: email.subject,
      content: [
        { type: "text/plain", value: email.text },
        { type: "text/html", value: email.html }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`SendGrid email failed with status ${response.status}`);
  }
}

async function sendJobAlertEmail(userEmail, jobsList) {
  if (!jobsList.length) return { skipped: true, reason: "No jobs to send" };

  const email = buildJobAlertEmail(userEmail, jobsList);

  if (process.env.RESEND_API_KEY) {
    await sendWithResend(userEmail, email);
    return { sent: true, provider: "resend" };
  }

  if (process.env.SENDGRID_API_KEY) {
    await sendWithSendGrid(userEmail, email);
    return { sent: true, provider: "sendgrid" };
  }

  console.log(`[job-alerts] Email provider not configured. Would send "${email.subject}" to ${userEmail}.`);
  return { sent: false, provider: "console", preview: email };
}

module.exports = {
  buildJobAlertEmail,
  sendJobAlertEmail
};
