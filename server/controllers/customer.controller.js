import mongoose from "mongoose";
import crypto from "crypto";

import User from "../models/user.model.js";
import Applicant from "../models/applicant.model.js";
import Enquiry from "../models/enquiry.model.js";

import { asyncHandler } from "../middlewares/errorHandler.js";
import { generateToken } from "../middlewares/auth.js";

import {
  sendWelcomeEmailWithResetLink,
  sendLoginEmail,
} from "../utils/email.js";

// =====================================================
// GENERATE CUSTOMER ID
// =====================================================
const generateCustomerId = () => {
  return `CUST-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
};

// =====================================================
// CONVERT ENQUIRY TO CUSTOMER
// =====================================================
export const convertEnquiryToCustomer = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { enquiryId, fullName, mobile } = req.body;

    if (!enquiryId) {
      return res.status(400).json({
        success: false,
        message: "Enquiry ID is required",
      });
    }

    const enquiry = await Enquiry.findOne({
      _id: enquiryId,
    }).session(session);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    if (enquiry.converted) {
      return res.status(400).json({
        success: false,
        message: "Enquiry already converted",
      });
    }

    if (!enquiry.email) {
      return res.status(400).json({
        success: false,
        message: "Customer email is required",
      });
    }

    const email = enquiry.email.toLowerCase().trim();

    // ====================================
    // EXISTING CUSTOMER CHECK
    // ====================================
    const existingUser = await User.findOne({
      email,
    }).session(session);

    if (existingUser) {
      await session.commitTransaction();
      session.endSession();

      sendLoginEmail(existingUser.email, existingUser.name).catch((err) => {
        console.error("Login email error:", err.message);
      });

      return res.status(200).json({
        success: true,
        message: "Customer already exists. Login email sent.",
        data: {
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            mobile: existingUser.mobile,
            role: existingUser.role,
          },
          applicantId: existingUser.applicantId,
        },
      });
    }

    // ====================================
    // CREATE APPLICANT
    // ====================================
    const applicant = await Applicant.create(
      [
        {
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
        },
      ],
      { session },
    );

    const resetToken = crypto.randomBytes(32).toString("hex");

    const tempPassword = crypto.randomBytes(16).toString("hex");

    const customer = await User.create(
      [
        {
          name: fullName?.trim() || enquiry.fullName || "Customer",

          email,

          password: tempPassword,

          role: "customer",

          mobile: mobile?.trim() || enquiry.mobile || "",

          panNumber: enquiry.panNumber || "",

          applicantId: applicant[0]._id,

          passwordResetToken: resetToken,

          passwordResetExpires: Date.now() + 24 * 60 * 60 * 1000,
        },
      ],
      { session },
    );

    enquiry.converted = true;
    await enquiry.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ====================================
    // SEND EMAIL ASYNC
    // ====================================
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const setPasswordLink =
      `${frontendUrl}/set-password` +
      `?token=${resetToken}` +
      `&email=${encodeURIComponent(email)}`;

    sendWelcomeEmailWithResetLink(
      email,
      customer[0].name,
      setPasswordLink,
    ).catch((err) => {
      console.error("Email send failed:", err.message);
    });

    const token = generateToken(customer[0]._id);

    return res.status(201).json({
      success: true,
      message: "Customer created successfully. Password setup email sent.",
      data: {
        user: {
          id: customer[0]._id,
          name: customer[0].name,
          email: customer[0].email,
          mobile: customer[0].mobile,
          role: customer[0].role,
        },

        applicantId: applicant[0]._id,

        token,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to convert enquiry to customer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// =====================================================
// GET ALL CUSTOMERS
// =====================================================
export const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({
    role: "customer",
  })
    .select("-password -passwordResetToken -passwordResetExpires")
    .populate("applicantId", "customerId profileCompletion profileCompleted")
    .sort({
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers,
  });
});

// =====================================================
// UPDATE CUSTOMER
// =====================================================
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await User.findOne({
    _id: id,
    role: "customer",
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  const { name, mobile, panNumber } = req.body;

  if (name) {
    customer.name = name.trim();
  }

  if (mobile) {
    customer.mobile = mobile.trim();
  }

  if (panNumber !== undefined) {
    customer.panNumber = panNumber.trim();
  }

  await customer.save();

  return res.status(200).json({
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

// =====================================================
// DELETE CUSTOMER
// =====================================================
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await User.findOne({
    _id: id,
    role: "customer",
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found",
    });
  }

  if (customer.applicantId) {
    await Applicant.findByIdAndDelete(customer.applicantId);
  }

  await customer.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Customer deleted successfully",
  });
});
