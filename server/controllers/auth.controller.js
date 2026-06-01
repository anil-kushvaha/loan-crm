import User from "../models/user.model.js";
import Applicant from "../models/applicant.model.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { generateToken } from "../middlewares/auth.js";

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

  if (!token || !email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Token, email, and new password are required",
    });
  }

  // Minimum password strength check
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

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

  // Set new password (pre-save hook will hash it automatically)
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password set successfully. You can now log in.",
  });
});
