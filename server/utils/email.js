import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.EMAIL_FROM;
const isProduction = process.env.NODE_ENV === "production";

// Validate configuration
if (!sendgridApiKey) {
  console.error("❌ SENDGRID_API_KEY is missing in environment variables");
  if (isProduction) {
    throw new Error("SendGrid API key required in production");
  }
} else {
  sgMail.setApiKey(sendgridApiKey);
}

if (!fromEmail && !isProduction) {
  console.warn("⚠️ EMAIL_FROM not set. Emails may fail.");
}

// Only log config in development
if (!isProduction) {
  console.log("📧 SendGrid Config:");
  console.log("   API Key exists:", !!sendgridApiKey);
  console.log("   From Email:", fromEmail || "not set");
  console.log("   Frontend URL:", process.env.FRONTEND_URL);
}

/**
 * Send a welcome email with a secure password-set link (no plain password)
 */
export const sendWelcomeEmailWithResetLink = async (
  to,
  name,
  setPasswordLink,
) => {
  if (!sendgridApiKey) {
    console.error("❌ Cannot send email: SendGrid API key missing");
    return false;
  }

  const finalFrom = fromEmail || "noreply@yourdomain.com";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";

  const msg = {
    to,
    from: finalFrom,
    subject: "Welcome to Loan CRM – Set up your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2c7da0;">Welcome to Loan CRM, ${name}!</h2>
        <p>Your customer account has been created. To get started, please set up your password using the link below.</p>
        <p style="margin: 24px 0;">
          <a href="${setPasswordLink}" style="background-color: #2c7da0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Set Your Password</a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 6px;">${setPasswordLink}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>After setting your password, you can log in at: <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} Loan CRM. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    if (!isProduction) {
      console.log(`✅ Email sent to ${to} (Status: ${response[0].statusCode})`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`);
    console.error("   Error message:", error.message);
    if (error.response && !isProduction) {
      console.error(
        "   SendGrid response:",
        JSON.stringify(error.response.body, null, 2),
      );
    }
    return false;
  }
};
