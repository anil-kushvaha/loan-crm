import User from "../models/user.model.js";
import Applicant from "../models/applicant.model.js";
import Enquiry from "../models/enquiry.model.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { generateToken } from "../middlewares/auth.js";
import { sendLoginCredentials } from "../utils/email.js";

const generateCustomerId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CUST-${timestamp}-${random}`;
};

export const convertEnquiryToCustomer = asyncHandler(async (req, res) => {
  const { enquiryId, password, fullName, panNumber, mobile } = req.body;

  if (!enquiryId || !password) {
    return res.status(400).json({
      success: false,
      message: "Enquiry ID and password are required",
    });
  }

  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) {
    return res
      .status(404)
      .json({ success: false, message: "Enquiry not found" });
  }
  if (enquiry.converted) {
    return res
      .status(400)
      .json({ success: false, message: "Enquiry already converted" });
  }

  const existingUser = await User.findOne({ email: enquiry.email });
  if (existingUser) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Customer already exists with this email",
      });
  }

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

  const customer = await User.create({
    name: fullName || enquiry.fullName,
    email: enquiry.email,
    password: password,
    role: "customer",
    mobile: mobile || enquiry.mobile,
    panNumber: panNumber || enquiry.panNumber || "",
    applicantId: applicant._id,
  });

  enquiry.converted = true;
  await enquiry.save();

  // 🔥 NON-BLOCKING EMAIL SEND (fire and forget)
  (async () => {
    try {
      await sendLoginCredentials(
        customer.email,
        customer.name,
        customer.email,
        password,
      );
      console.log(`✅ Email sent to ${customer.email}`);
    } catch (err) {
      console.log(`❌ Email failed: ${err.message}`);
    }
  })();

  const token = generateToken(customer._id);

  return res.status(201).json({
    success: true,
    message: "Customer created successfully",
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

// (Keep the rest of your functions – getAllCustomers, updateCustomer, deleteCustomer – unchanged)
export const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "customer" })
    .select("-password")
    .populate("applicantId", "customerId profileCompletion")
    .sort({ createdAt: -1 });
  res
    .status(200)
    .json({ success: true, count: customers.length, data: customers });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, mobile, panNumber, password } = req.body;
  const customer = await User.findOne({ _id: id, role: "customer" });
  if (!customer)
    return res
      .status(404)
      .json({ success: false, message: "Customer not found" });
  if (name) customer.name = name.trim();
  if (mobile) customer.mobile = mobile.trim();
  if (panNumber !== undefined) customer.panNumber = panNumber.trim();
  if (password) customer.password = password.trim();
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

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await User.findOne({ _id: id, role: "customer" });
  if (!customer)
    return res
      .status(404)
      .json({ success: false, message: "Customer not found" });
  if (customer.applicantId)
    await Applicant.findByIdAndDelete(customer.applicantId);
  await customer.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "Customer deleted successfully" });
});
