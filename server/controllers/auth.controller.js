import User from "../models/user.model.js";
import Applicant from "../models/applicant.model.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { generateToken } from "../middlewares/auth.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  // ✅ For customers, fetch the linked applicant to get customerId
  let customerId = null;
  let applicantId = null;
  if (user.role === "customer" && user.applicantId) {
    const applicant = await Applicant.findById(user.applicantId);
    if (applicant) {
      customerId = applicant.customerId;
      applicantId = applicant._id;
    }
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
        customerId: customerId, // e.g., "CUST-1A2B3C4D-EFGH"
        applicantId: applicantId, // MongoDB _id of the applicant
      },
    },
  });
});
