import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Remove spaces from App Password if any
const emailPass = (process.env.EMAIL_PASS || "").replace(/\s/g, "");

console.log("🔐 Testing email connection...");
console.log(`📧 EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`🔑 EMAIL_PASS: ${emailPass ? "✅ Provided" : "❌ Missing"}`);
console.log(`🌐 EMAIL_HOST: ${process.env.EMAIL_HOST}`);
console.log(`🚪 EMAIL_PORT: ${process.env.EMAIL_PORT}`);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPass,
  },
  family: 4, // Force IPv4
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

// 1. Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Connection VERIFY FAILED:", error.message);
    process.exit(1);
  } else {
    console.log("✅ Connection VERIFY SUCCESS");
    // 2. Try sending a test email
    sendTestEmail();
  }
});

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Test" <${process.env.EMAIL_USER}>`,
      to: "anilkushvaha45@gmail.com", // 👈 CHANGE THIS to your personal email
      subject: "Test Email from Loan CRM",
      text: "This is a test email to check if SMTP is working.",
      html: "<b>This is a test email</b><p>If you receive this, your email configuration is correct.</p>",
    });
    console.log("✅ Test email sent. Message ID:", info.messageId);
    console.log("📬 Check your inbox (and spam folder) for the test email.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test email send FAILED:", error.message);
    process.exit(1);
  }
}
