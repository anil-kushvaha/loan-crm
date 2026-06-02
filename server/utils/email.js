import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.EMAIL_FROM;
const frontendUrl = process.env.FRONTEND_URL;
const isProduction = process.env.NODE_ENV === "production";

// ======================
// CONFIG
// ======================

if (!sendgridApiKey) {
  console.error("❌ SENDGRID_API_KEY is missing");

  if (isProduction) {
    throw new Error("SENDGRID_API_KEY is required in production");
  }
} else {
  sgMail.setApiKey(sendgridApiKey);
}

if (!isProduction) {
  console.log("📧 Email Config");
  console.log("API Key Exists:", !!sendgridApiKey);
  console.log("EMAIL_FROM:", fromEmail);
  console.log("FRONTEND_URL:", frontendUrl);
}

// ======================
// COMMON EMAIL FUNCTION
// ======================

const sendEmail = async (msg) => {
  try {
    const response = await sgMail.send(msg);

    console.log(`✅ Email sent successfully (${response[0].statusCode})`);

    return true;
  } catch (error) {
    console.error("❌ Email send failed");
    console.error(error.message);

    if (error.response) {
      console.error(JSON.stringify(error.response.body, null, 2));
    }

    return false;
  }
};

// ======================
// WELCOME EMAIL
// ======================

export const sendWelcomeEmailWithResetLink = async (
  to,
  name,
  setPasswordLink,
) => {
  const msg = {
    to,
    from: fromEmail || "noreply@yourdomain.com",
    subject: "Welcome to Loan CRM - Set Your Password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;">
        
        <h2>
          Welcome ${name}
        </h2>

        <p>
          Your Loan CRM account has been created.
        </p>

        <p>
          Click the button below to set your password:
        </p>

        <p>
          <a
            href="${setPasswordLink}"
            style="
              background:#2563eb;
              color:white;
              padding:12px 24px;
              border-radius:6px;
              text-decoration:none;
            "
          >
            Set Password
          </a>
        </p>

        <p>
          If button doesn't work:
        </p>

        <p>
          ${setPasswordLink}
        </p>

        <p>
          This link expires in 24 hours.
        </p>

        <hr>

        <p>
          Loan CRM Team
        </p>

      </div>
    `,
  };

  return sendEmail(msg);
};

// ======================
// LOGIN EMAIL
// ======================

export const sendLoginEmail = async (to, name) => {
  const msg = {
    to,
    from: fromEmail || "noreply@yourdomain.com",
    subject: "Loan CRM Account Access",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">

        <h2>
          Hello ${name}
        </h2>

        <p>
          Your Loan CRM account already exists.
        </p>

        <p>
          Login using your credentials.
        </p>

        <p>
          <a
            href="${frontendUrl}/login"
            style="
              background:#2563eb;
              color:white;
              padding:12px 24px;
              border-radius:6px;
              text-decoration:none;
            "
          >
            Login Now
          </a>
        </p>

        <p>
          Forgot password?
          Use the Forgot Password option.
        </p>

        <hr>

        <p>
          Loan CRM Team
        </p>

      </div>
    `,
  };

  return sendEmail(msg);
};

// ======================
// FORGOT PASSWORD EMAIL
// ======================

export const sendPasswordResetEmail = async (to, name, resetLink) => {
  const msg = {
    to,
    from: fromEmail || "noreply@yourdomain.com",
    subject: "Reset Your Password - Loan CRM",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;">

        <h2>
          Hello ${name}
        </h2>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          Click the button below:
        </p>

        <p>
          <a
            href="${resetLink}"
            style="
              background:#2563eb;
              color:white;
              padding:12px 24px;
              border-radius:6px;
              text-decoration:none;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          If button doesn't work:
        </p>

        <p style="word-break:break-all;">
          ${resetLink}
        </p>

        <p>
          This link will expire in 1 hour.
        </p>

        <p>
          If you did not request this,
          please ignore this email.
        </p>

        <hr>

        <p>
          Loan CRM Team
        </p>

      </div>
    `,
  };

  return sendEmail(msg);
};
