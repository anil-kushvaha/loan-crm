import crypto from "crypto";
import User from "../models/user.model.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { generateToken } from "../middlewares/auth.js";
import { sendPasswordResetEmail } from "../utils/email.js";

// =======================
// LOGIN CONTROLLER
// =======================
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password required",
    });
  }

  // Populate applicantId to get customerId in one query
  const user = await User.findOne({ email }).populate("applicantId");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  let customerId = null;
  let applicantId = null;

  if (user.role === "customer" && user.applicantId) {
    customerId = user.applicantId.customerId;
    applicantId = user.applicantId._id;
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile || "",
        customerId: customerId,
        applicantId: applicantId,
      },
    },
  });
});

// =======================
// SET PASSWORD CONTROLLER
// =======================
export const setPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  const user = await User.findOne({
    email,
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset link. Please request a new one.",
    });
  }

  user.password = newPassword;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save(); // <-- pre-save hook chalega aur password hash hoga

  res.json({
    success: true,
    message: "Password set successfully.",
  });
});
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    return res.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.passwordResetToken = resetToken;

  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  await user.save();

  const frontendUrl = process.env.FRONTEND_URL;

  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${user.email}`;

  await sendPasswordResetEmail(user.email, user.name, resetLink);

  res.json({
    success: true,
    message: "Password reset link sent successfully.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const user = await User.findOne({
    email,
    passwordResetToken: token,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset link",
    });
  }

  user.password = password;

  user.passwordResetToken = undefined;

  user.passwordResetExpires = undefined;

  await user.save();

  res.json({
    success: true,
    message: "Password reset successful",
  });
});
