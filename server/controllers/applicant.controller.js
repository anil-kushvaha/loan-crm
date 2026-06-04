import Applicant from "../models/applicant.model.js";
import { createAuditLogs } from "../utils/auditLogger.js";
import { calculateProfileCompletion } from "../utils/profileCompletion.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  personalDetailsSchema,
  addressDetailsSchema,
  employmentDetailsSchema,
  coApplicantsSchema,
} from "../validators/applicant.validator.js";
import cloudinary from "../config/cloudinary.js";

// Helper to update step and completion
const updateStepAndCompletion = async (
  applicant,
  nextStep,
  section,
  oldData,
  newData,
  userId,
) => {
  applicant.currentStep = Math.max(applicant.currentStep, nextStep);
  await calculateProfileCompletion(applicant);
  await applicant.save();
  await createAuditLogs({
    oldData,
    newData,
    applicantId: applicant._id,
    updatedBy: userId,
    section,
  });
};

export const createApplicant = asyncHandler(async (req, res) => {
  const { customerId } = req.body;
  const existing = await Applicant.findOne({ customerId });
  if (existing)
    return res
      .status(400)
      .json({ success: false, message: "Applicant already exists" });
  const applicant = await Applicant.create({ customerId });
  res.status(201).json({ success: true, data: applicant });
});

export const getApplicant = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const applicant = await Applicant.findOne({ customerId });
  if (!applicant)
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });
  res.json({ success: true, data: applicant });
});

export const updatePersonalDetails = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const applicant = await Applicant.findById(applicantId);
  if (!applicant)
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });

  const { error, value } = personalDetailsSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });

  const oldData = applicant.personalDetails?.toObject() || {};
  applicant.personalDetails = { ...oldData, ...value };
  await updateStepAndCompletion(
    applicant,
    2,
    "personalDetails",
    oldData,
    value,
    req.user?._id,
  );
  res.json({
    success: true,
    message: "Personal details updated",
    data: applicant,
  });
});

export const updateAddressDetails = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const applicant = await Applicant.findById(applicantId);
  if (!applicant)
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });

  const { error, value } = addressDetailsSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });

  const oldData = applicant.addressDetails?.toObject() || {};
  applicant.addressDetails = { ...oldData, ...value };
  await updateStepAndCompletion(
    applicant,
    3,
    "addressDetails",
    oldData,
    value,
    req.user?._id,
  );
  res.json({
    success: true,
    message: "Address details updated",
    data: applicant,
  });
});

export const updateEmploymentDetails = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const applicant = await Applicant.findById(applicantId);
  if (!applicant)
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });

  const { error, value } = employmentDetailsSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });

  const oldData = applicant.employmentDetails?.toObject() || {};
  applicant.employmentDetails = { ...oldData, ...value };
  await updateStepAndCompletion(
    applicant,
    4,
    "employmentDetails",
    oldData,
    value,
    req.user?._id,
  );
  res.json({
    success: true,
    message: "Employment details updated",
    data: applicant,
  });
});

export const updateCoApplicants = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const applicant = await Applicant.findById(applicantId);
  if (!applicant)
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });

  const { error, value } = coApplicantsSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });

  const oldData = [...(applicant.coApplicants || [])].map((c) => c.toObject());
  applicant.coApplicants = value.coApplicants;
  await updateStepAndCompletion(
    applicant,
    5,
    "coApplicants",
    oldData,
    value.coApplicants,
    req.user?._id,
  );
  res.json({
    success: true,
    message: "Co-applicants updated",
    data: applicant,
  });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;
  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });
  }

  const { documentName, documentType } = req.body;
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  // Check if document with same name already exists
  const existingDocIndex = applicant.documents.findIndex(
    (doc) => doc.documentName.toLowerCase() === documentName.toLowerCase(),
  );

  // If exists, delete old file from Cloudinary
  if (existingDocIndex !== -1) {
    const existingDoc = applicant.documents[existingDocIndex];
    if (existingDoc.publicId) {
      try {
        await cloudinary.uploader.destroy(existingDoc.publicId);
      } catch (cloudErr) {
        console.error("Cloudinary delete error during replace:", cloudErr);
        // Continue anyway, we still upload new file
      }
    }
    // Remove the old document from array
    applicant.documents.splice(existingDocIndex, 1);
  }

  try {
    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `loan_applications/${applicant.customerId}`,
          resource_type: "auto",
          access_mode: "public", // <-- ADD THIS LINE
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        },
      );
      uploadStream.end(req.file.buffer);
    });

    const documentUrl = result.secure_url;
    const publicId = result.public_id;

    applicant.documents.push({
      documentName,
      documentType,
      documentUrl,
      publicId,
      verified: false,
      uploadedAt: new Date(),
    });
    await applicant.save();
    await calculateProfileCompletion(applicant);
    await applicant.save();

    res.json({ success: true, message: "Document uploaded", data: applicant });
  } catch (cloudError) {
    console.error("Cloudinary upload error:", cloudError);
    const errorMessage =
      cloudError.message || "File upload failed. Please try again.";
    res.status(500).json({ success: false, message: errorMessage });
  }
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { applicantId, documentId } = req.params;
  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    return res
      .status(404)
      .json({ success: false, message: "Applicant not found" });
  }

  const documentIndex = applicant.documents.findIndex(
    (doc) => doc._id.toString() === documentId,
  );
  if (documentIndex === -1) {
    return res
      .status(404)
      .json({ success: false, message: "Document not found" });
  }

  const document = applicant.documents[documentIndex];

  // Delete from Cloudinary if publicId exists
  if (document.publicId) {
    try {
      await cloudinary.uploader.destroy(document.publicId);
    } catch (cloudErr) {
      console.error("Cloudinary delete error:", cloudErr);
      // Continue to remove from DB even if Cloudinary fails
    }
  }

  // Remove from array
  applicant.documents.splice(documentIndex, 1);
  await applicant.save();
  await calculateProfileCompletion(applicant);
  await applicant.save();

  res.json({
    success: true,
    message: "Document deleted successfully",
    data: applicant,
  });
});
