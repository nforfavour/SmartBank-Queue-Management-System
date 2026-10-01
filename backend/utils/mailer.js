// utils/mailer.js
// Sends verification emails through the Brevo HTTP API (HTTPS, not SMTP).

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 15000;

function buildHtml(code) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px;">
      <h2>SmartBank Email Verification</h2>
      <p>Thank you for registering with SmartBank.</p>
      <p>Your 6-digit verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 25px 0;">${code}</div>
      <p>Enter this code in SmartBank to complete your registration.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>`;
}

async function sendVerificationEmail(toEmail, code) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "SmartBank";

  // Dev mode: no key -> print the code in the terminal
  if (!apiKey && process.env.NODE_ENV !== "production") {
    console.warn("[MAIL] BREVO_API_KEY not set (dev mode). No email sent.");
    console.warn(`[MAIL] Verification code for ${toEmail}: ${code}`);
    return;
  }

  if (!apiKey || !senderEmail) {
    throw new Error("Email is not configured: set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: "SmartBank - Email Verification Code",
        htmlContent: buildHtml(code),
        textContent:
          `Your SmartBank verification code is: ${code}\n\n` +
          `Enter this code in SmartBank to complete your registration.\n\n` +
          `If you did not create this account, you can ignore this email.`,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Brevo request timed out after " + TIMEOUT_MS + "ms");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const bodyText = await res.text();
  if (!res.ok) throw new Error(`Brevo API error ${res.status}: ${bodyText}`);

  console.log("[MAIL] Email sent via Brevo to", toEmail, bodyText);
}

module.exports = { sendVerificationEmail };
