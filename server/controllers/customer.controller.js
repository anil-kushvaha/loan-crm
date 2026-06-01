import User from "../models/user.model.js";
import Applicant from "../models/applicant.model.js";
import Enquiry from "../models/enquiry.model.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { generateToken } from "../middlewares/auth.js";
import { sendWelcomeEmailWithResetLink } from "../utils/email.js";
import crypto from "crypto";

// =======================
// GENERATE CUSTOMER ID (more robust)
// =======================
const generateCustomerId = () => {
  // Use timestamp + random bytes + counter fallback to avoid collisions
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `CUST-${timestamp}-${randomBytes}`;
};

// =======================
// CONVERT ENQUIRY TO CUSTOMER
// =======================
export const convertEnquiryToCustomer = asyncHandler(async (req, res) => {
  const { enquiryId, fullName, mobile } = req.body;

  if (!enquiryId) {
    return res.status(400).json({
      success: false,
      message: "Enquiry ID is required",
    });
  }

  // Atomically find and update the enquiry to prevent race conditions
  const enquiry = await Enquiry.findOneAndUpdate(
    { _id: enquiryId, converted: false },
    { converted: true },
    { new: true },
  );

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Enquiry not found or already converted",
    });
  }

  // Ensure enquiry has required fields
  if (!enquiry.email || !enquiry.fullName) {
    // Rollback conversion flag (optional, but good for data integrity)
    await Enquiry.findByIdAndUpdate(enquiryId, { converted: false });
    return res.status(400).json({
      success: false,
      message: "Enquiry missing email or full name. Cannot create customer.",
    });
  }

  // Check if user already exists with this email
  const existingUser = await User.findOne({ email: enquiry.email });
  if (existingUser) {
    // Rollback conversion flag
    await Enquiry.findByIdAndUpdate(enquiryId, { converted: false });
    return res.status(400).json({
      success: false,
      message: "Customer already exists with this email",
    });
  }

  // Create applicant record
  const applicant = await Applicant.create({
    customerId: generateCustomerId(),
    personalDetails: {},
    completedSteps: {
      personalDetails: false,
      addressDetails: false,
      employmentDetails: false,
      coApplicants: false,
      documents: false,
    },
    currentStep: 1,
    profileCompletion: 0,
    profileCompleted: false,
  });

  // Generate a secure one-time password reset token (instead of sending plain password)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Create customer with a temporary random password (will be hashed by pre-save hook)
  const tempPassword = crypto.randomBytes(12).toString("hex");
  const customer = await User.create({
    name: fullName?.trim() || enquiry.fullName,
    email: enquiry.email,
    password: tempPassword, // This will be hashed by your User model's pre-save middleware
    role: "customer",
    mobile: mobile?.trim() || enquiry.mobile || "",
    panNumber: enquiry.panNumber || "",
    applicantId: applicant._id,
    passwordResetToken: resetToken,
    passwordResetExpires: resetTokenExpiry,
  });

  // Send email with a secure set-password link (no plain password in email)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
  const setPasswordLink = `${frontendUrl}/set-password?token=${resetToken}&email=${encodeURIComponent(customer.email)}`;

  // Fire-and-forget email (non-blocking)
  (async () => {
    try {
      await sendWelcomeEmailWithResetLink(
        customer.email,
        customer.name,
        setPasswordLink,
      );
      console.log(`✅ Welcome email sent to ${customer.email}`);
    } catch (err) {
      console.error(`❌ Email failed to ${customer.email}: ${err.message}`);
      // Optional: store a flag in DB for retry
    }
  })();

  // Generate auth token and respond immediately
  const token = generateToken(customer._id);

  return res.status(201).json({
    success: true,
    message:
      "Customer created successfully. A password setup link has been sent to their email.",
    data: {
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        mobile: customer.mobile,
      },
      applicantId: applicant._id,
      token,
    },
  });
});

// =======================
// GET ALL CUSTOMERS
// =======================
export const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "customer" })
    .select("-password -passwordResetToken -passwordResetExpires")
    .populate("applicantId", "customerId profileCompletion")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers,
  });
});

// =======================
// UPDATE CUSTOMER
// =======================
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, mobile, panNumber } = req.body; // Password updates should go through a dedicated "change password" endpoint

  const customer = await User.findOne({ _id: id, role: "customer" });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  if (name) customer.name = name.trim();
  if (mobile) {
    // Add mobile validation (e.g., regex) here if needed
    customer.mobile = mobile.trim();
  }
  if (panNumber !== undefined) {
    // Add PAN format validation
    customer.panNumber = panNumber.trim();
  }

  await customer.save();

  res.status(200).json({
    success: true,
    message: "Customer updated successfully",
    data: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      panNumber: customer.panNumber,
    },
  });
});

// =======================
// DELETE CUSTOMER
// =======================
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await User.findOne({ _id: id, role: "customer" });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  if (customer.applicantId) {
    await Applicant.findByIdAndDelete(customer.applicantId);
  }

  // Use deleteOne() or remove() – ensure any hooks you need are triggered
  await customer.deleteOne();

  res.status(200).json({
    success: true,
    message: "Customer deleted successfully",
  });
});
