import mongoose from "mongoose";

const addressSubSchema = new mongoose.Schema(
  {
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: "India", trim: true },
  },
  { _id: false },
);

const personalDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: Date,
    age: Number,
    email: { type: String, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    mobile: { type: String, trim: true },
    alternateNumber: { type: String, trim: true },
    panCard: { type: String, uppercase: true, trim: true },
    aadhaar: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    maritalStatus: String,
    spouseName: String,
    spouseFatherName: String,
    spouseMotherName: String,
    qualification: String,
    preferredLanguage: String,
    nationality: String,
  },
  { _id: false },
);

const employmentSchema = new mongoose.Schema(
  {
    employmentType: {
      type: String,
      enum: ["salaried", "self-employed", "business", "other"],
    },
    companyName: String,
    companyType: String,
    salary: Number,
    salaryMode: String,
    salaryAccountBank: String,
    workExperience: Number,
    professionType: String,
    officeAddress: String,
    businessName: String,
    businessType: String,
    industryType: String,
    annualTurnover: Number,
    businessVintage: Number,
    gstRegistered: String,
    gstNumber: String,
    incomeSource: String,
    monthlyIncome: Number,
    annualIncome: Number,
  },
  { _id: false },
);

const coApplicantSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    relation: String,
    gender: String,
    dob: Date,
    age: Number,
    email: { type: String, lowercase: true },
    mobile: String,
    panCard: String,
    employmentType: String,
    salary: Number,
    sameAsPrimary: { type: Boolean, default: false },
    address: addressSubSchema,
  },
  { timestamps: true },
);

const applicantSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    currentStep: { type: Number, default: 1 },
    completedSteps: {
      personalDetails: { type: Boolean, default: false },
      addressDetails: { type: Boolean, default: false },
      employmentDetails: { type: Boolean, default: false },
      coApplicants: { type: Boolean, default: false },
      documents: { type: Boolean, default: false },
    },
    profileCompletion: { type: Number, default: 0 },
    profileCompleted: { type: Boolean, default: false },
    personalDetails: personalDetailsSchema,
    addressDetails: addressSubSchema,
    employmentDetails: employmentSchema,
    coApplicants: [coApplicantSchema],
    documents: [
      {
        documentName: String,
        documentType: String,
        documentUrl: String,
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

applicantSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Applicant", applicantSchema);
