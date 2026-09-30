// utils/mailer.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }

});

transporter.verify((error, success) => {

  if (error) {

    console.error(
      "[MAIL] Gmail connection failed:"
    );

    console.error(error);

  } else {

    console.log(
      "[MAIL] Gmail connection successful."
    );

  }

});

async function sendVerificationEmail(
  toEmail,
  code
) {

  const info = await transporter.sendMail({

    from:
      `"SmartBank" <${process.env.EMAIL_USER}>`,

    to: toEmail,

    subject:
      "SmartBank - Email Verification Code",

    text:
      `Your SmartBank verification code is: ${code}

Enter this code in SmartBank to verify your email address.`,

    html: `

      <div style="
        font-family: Arial, sans-serif;
        padding: 20px;
      ">

        <h2>SmartBank Email Verification</h2>

        <p>
          Thank you for registering with SmartBank.
        </p>

        <p>
          Your 6-digit verification code is:
        </p>

        <h1 style="
          letter-spacing: 8px;
        ">
          ${code}
        </h1>

        <p>
          Enter this code in the SmartBank application
          to complete your registration.
        </p>

        <p>
          If you did not create this account,
          you can ignore this email.
        </p>

      </div>

    `

  });


  console.log(
    "[MAIL] Email sent successfully."
  );

  console.log(
    "[MAIL] Recipient:",
    toEmail
  );

  console.log(
    "[MAIL] Message ID:",
    info.messageId
  );

}


module.exports = {
  sendVerificationEmail
};