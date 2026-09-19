// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function sendVerificationEmail(toEmail, code) {
  await transporter.sendMail({
    from: `"SmartBank" <${process.env.BREVO_SMTP_LOGIN}>`,
    to: toEmail,
    subject: "Your SmartBank verification code",
    text: `Your verification code is: ${code}\n\nEnter this code to finish creating your account.`,
    html: `<p>Your verification code is:</p><h2>${code}</h2><p>Enter this code to finish creating your account.</p>`,
  });
}

module.exports = { sendVerificationEmail };