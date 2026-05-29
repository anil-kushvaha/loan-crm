import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // always false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// test connection
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email Server Error:", error);
  } else {
    console.log("✅ Email Server Ready");
  }
});

export const sendLoginCredentials = async (to, name, email, password) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Welcome – Your Loan CRM Account Credentials",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Welcome ${name}</h2>
          <p>Your account has been created.</p>

          <h3>Login Details:</h3>
          <p><b>Email:</b> ${email}</p>
          <p><b>Password:</b> ${password}</p>

          <p>
            <a href="${process.env.FRONTEND_URL}/login">
              Login Here
            </a>
          </p>

          <p style="color: gray; font-size: 12px;">
            Please change your password after login.
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.log("❌ Email Send Error:", error);
  }
};
