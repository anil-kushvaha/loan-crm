import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // ✅ HARD CODE (MOST STABLE FIX)
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify only after env load
setTimeout(() => {
  transporter.verify((error) => {
    if (error) {
      console.log("❌ Email Server Error:", error);
    } else {
      console.log("✅ Email Server Ready");
    }
  });
}, 3000);

export const sendLoginCredentials = async (to, name, email, password) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Welcome – Your Loan CRM Account Credentials",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Welcome ${name}</h2>
          <p>Your account has been created successfully.</p>

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

    console.log("✅ Email sent successfully to:", to);
  } catch (error) {
    console.log("❌ Email Send Error:", error.message);
  }
};
