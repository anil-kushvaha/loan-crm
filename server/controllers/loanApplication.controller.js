import LoanApplication, { LOAN_TYPES } from "../models/LoanApplication.js";
import Applicant from "../models/applicant.model.js";
import { validateLoanDetails } from "../utils/loanValidation.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

// Apply for a loan (customer only)
export const applyForLoan = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const { loanType, loanDetails } = req.body;

  // 1. Validate loan type
  if (!Object.values(LOAN_TYPES).includes(loanType)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid loan type" });
  }

  // 2. Fetch applicant and check profile completion
  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });
  }
  if (!applicant.profileCompleted) {
    return res.status(400).json({
      success: false,
      message:
        "Complete your profile (personal, address, employment, documents) before applying for a loan",
    });
  }

  // 3. Validate loan-specific fields
  try {
    validateLoanDetails(loanType, loanDetails);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // 4. Create loan application
  const application = new LoanApplication({
    applicantId: applicant._id,
    customerId: applicant.customerId,
    loanType,
    loanDetails,
    status: "PENDING",
  });

  // 5. Handle duplicate application (same loanType for same applicant)
  try {
    await application.save();
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `You have already applied for a ${loanType}. Duplicate applications are not allowed.`,
      });
    }
    throw error;
  }

  res.status(201).json({
    success: true,
    message: "Loan application submitted successfully",
    data: application,
  });
});

// Get all loan applications for a customer (with filtering)
export const getMyApplications = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const { status, loanType } = req.query;

  const filter = { applicantId };
  if (status) filter.status = status;
  if (loanType) filter.loanType = loanType;

  const applications = await LoanApplication.find(filter).sort({
    appliedAt: -1,
  });
  res.json({ success: true, data: applications });
});

// Admin/Employee: get all applications (with pagination)
export const getAllApplications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const applications = await LoanApplication.find()
    .populate(
      "applicantId",
      "customerId personalDetails.fullName personalDetails.email",
    )
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await LoanApplication.countDocuments();

  res.json({
    success: true,
    data: applications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// Admin/Employee: update application status
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status, remarks } = req.body;

  if (!["PENDING", "APPROVED", "REJECTED", "DISBURSED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const application = await LoanApplication.findById(applicationId);
  if (!application) {
    return res
      .status(404)
      .json({ success: false, message: "Application not found" });
  }

  application.status = status;
  if (remarks) application.remarks = remarks;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();

  await application.save();

  res.json({ success: true, message: "Status updated", data: application });
});
// Admin/Employee: fetch all loan applications for a specific applicant (by applicantId)
export const getApplicationsByApplicantId = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const { status, loanType } = req.query;

  const filter = { applicantId };
  if (status) filter.status = status;
  if (loanType) filter.loanType = loanType;

  const applications = await LoanApplication.find(filter).sort({
    appliedAt: -1,
  });
  res.json({ success: true, data: applications });
});
