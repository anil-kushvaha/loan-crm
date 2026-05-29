import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendLoginCredentials = async (to, name, email, password) => {
  const subject = "Welcome – Your Loan CRM Account Credentials";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #2c7da0;">Welcome to Loan CRM, ${name}!</h2>
      <p>Your customer account has been created successfully. You can now log in to complete your loan application.</p>
      <p><strong>Your login credentials:</strong></p>
      <ul style="background: #f8fafc; padding: 16px; border-radius: 8px;">
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL}/login" target="_blank">${process.env.FRONTEND_URL}/login</a></p>
      <p style="margin-top: 24px; font-size: 12px; color: #64748b;">For security reasons, please change your password after your first login.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">© ${new Date().getFullYear()} Loan CRM. All rights reserved.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};
