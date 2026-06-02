import Enquiry from "../models/enquiry.model.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

// =====================
// SUBMIT ENQUIRY
// =====================
export const submitEnquiry = asyncHandler(async (req, res) => {
  const {
    fullName,
    panNumber,
    email,
    mobile,
    ourServices,
    serviceType,
    referenceName,
    referenceEmail,
    agreeToUpdates,
  } = req.body;

  // Required Fields Validation
  if (
    !fullName ||
    !panNumber ||
    !email ||
    !mobile ||
    !ourServices ||
    !serviceType
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Full Name, PAN Number, Email, Mobile, Service and Service Type are required",
    });
  }

  const enquiry = await Enquiry.create({
    fullName,
    panNumber,
    email,
    mobile,
    ourServices,
    serviceType,
    referenceName: referenceName || "",
    referenceEmail: referenceEmail || "",
    agreeToUpdates: agreeToUpdates || false,
    converted: false,
  });

  res.status(201).json({
    success: true,
    message: "Enquiry submitted successfully",
    data: enquiry,
  });
});

// =====================
// GET ALL PENDING ENQUIRIES
// =====================
export const getAllEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find({
    $or: [{ converted: false }, { converted: { $exists: false } }],
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: enquiries.length,
    data: enquiries,
  });
});
