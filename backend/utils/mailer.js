// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(toEmail, code) {
  await transporter.sendMail({
    from: `"SmartBank" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your SmartBank verification code",
    text: `Your verification code is: ${code}\n\nEnter this code to finish creating your account.`,
    html: `<p>Your verification code is:</p><h2>${code}</h2><p>Enter this code to finish creating your account.</p>`,
  });
}

module.exports = { sendVerificationEmail };