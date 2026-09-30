// utils/mailer.js

const nodemailer = require("nodemailer");


// ======================================================
// GMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }

});


// ======================================================
// CHECK GMAIL CONNECTION
// ======================================================

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


// ======================================================
// SEND VERIFICATION EMAIL
// ======================================================

async function sendVerificationEmail(
  toEmail,
  code
) {

  const info =
    await transporter.sendMail({

      from:
        `"SmartBank" <${process.env.EMAIL_USER}>`,

      to: toEmail,

      subject:
        "SmartBank - Email Verification Code",

      text:
        `Your SmartBank verification code is: ${code}

Enter this code in SmartBank to complete your registration.

If you did not create this account, you can ignore this email.`,

      html: `

        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
        ">

          <h2>
            SmartBank Email Verification
          </h2>

          <p>
            Thank you for registering with SmartBank.
          </p>

          <p>
            Your 6-digit verification code is:
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 25px 0;
          ">
            ${code}
          </div>

          <p>
            Enter this code in SmartBank
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
    "[MAIL] Accepted:",
    info.accepted
  );

  console.log(
    "[MAIL] Rejected:",
    info.rejected
  );

  console.log(
    "[MAIL] Message ID:",
    info.messageId
  );

}


module.exports = {
  sendVerificationEmail
};