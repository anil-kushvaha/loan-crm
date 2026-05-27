import Joi from "joi";

const addressSchema = Joi.object({
  addressLine1: Joi.string().trim().allow(""),
  addressLine2: Joi.string().trim().allow(""),
  landmark: Joi.string().trim().allow(""),
  city: Joi.string().trim().allow(""),
  state: Joi.string().trim().allow(""),
  pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .messages({ "string.pattern.base": "Pincode must be 6 digits" }),
  country: Joi.string().default("India"),
});

export const personalDetailsSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  gender: Joi.string().valid("male", "female", "other"),
  dob: Joi.date().less("now"),
  email: Joi.string().email(),
  mobile: Joi.string().pattern(/^\d{10}$/),
  alternateNumber: Joi.string()
    .pattern(/^\d{10}$/)
    .allow(""),
  panCard: Joi.string().alphanum().uppercase().length(10),
  aadhaar: Joi.string()
    .pattern(/^\d{12}$/)
    .allow(""), // ✅ ADDED
  fatherName: Joi.string().allow(""),
  motherName: Joi.string().allow(""),
  maritalStatus: Joi.string()
    .valid("single", "married", "divorced", "widowed")
    .allow(""),
  spouseName: Joi.string().allow(""),
  spouseFatherName: Joi.string().allow(""),
  spouseMotherName: Joi.string().allow(""),
  qualification: Joi.string().allow(""),
  preferredLanguage: Joi.string().allow(""),
  nationality: Joi.string().default("India"),
}).min(1);

export const addressDetailsSchema = addressSchema.min(1);

export const employmentDetailsSchema = Joi.object({
  employmentType: Joi.string().valid(
    "salaried",
    "self-employed",
    "business",
    "other",
  ),
  companyName: Joi.string().when("employmentType", {
    is: "salaried",
    then: Joi.required(),
  }),
  companyType: Joi.string().allow(""),
  salary: Joi.number().positive().allow(null),
  salaryMode: Joi.string().valid("monthly", "yearly").allow(""),
  salaryAccountBank: Joi.string().allow(""),
  workExperience: Joi.number().min(0).max(50).allow(null),
  professionType: Joi.string().allow(""),
  officeAddress: Joi.string().allow(""),
  businessName: Joi.string().when("employmentType", {
    is: "self-employed",
    then: Joi.required(),
  }),
  businessType: Joi.string().allow(""),
  industryType: Joi.string().allow(""),
  annualTurnover: Joi.number().positive().allow(null),
  businessVintage: Joi.number().min(0).allow(null),
  gstRegistered: Joi.string().valid("yes", "no").allow(""),
  gstNumber: Joi.string().when("gstRegistered", {
    is: "yes",
    then: Joi.required(),
  }),
  incomeSource: Joi.string().allow(""),
  monthlyIncome: Joi.number().positive().allow(null),
  annualIncome: Joi.number().positive().allow(null),
}).min(1);

export const coApplicantsSchema = Joi.object({
  coApplicants: Joi.array().items(
    Joi.object({
      fullName: Joi.string().required(),
      relation: Joi.string().required(),
      gender: Joi.string().valid("male", "female", "other"),
      dob: Joi.date().less("now"),
      age: Joi.number().min(0).max(120),
      email: Joi.string().email(),
      mobile: Joi.string().pattern(/^\d{10}$/),
      panCard: Joi.string().alphanum().uppercase().length(10),
      employmentType: Joi.string().valid(
        "salaried",
        "self-employed",
        "business",
        "other",
      ),
      salary: Joi.number().positive(),
      sameAsPrimary: Joi.boolean().default(false),
      address: addressSchema,
    }),
  ),
});
