export const LOAN_FIELD_SCHEMAS = {
  PERSONAL_LOAN: {
    requestAmount: { type: "number", required: true, min: 10000 },
    personalTenure: { type: "number", required: true, min: 1, max: 84 },
    loanPurpose: { type: "string", required: true, trim: true },
  },
  HOME_LOAN: {
    requestAmount: { type: "number", required: true },
    propertyType: { type: "string", required: true },
    propertyLocation: { type: "string", required: true },
    propertyValue: { type: "number", required: true },
    propertyStage: { type: "string", required: true },
    cibil: { type: "number", required: true, min: 300, max: 900 },
  },
  CAR_LOAN: {
    requestAmount: { type: "number", required: true },
    carTenure: { type: "number", required: true, min: 12, max: 84 },
    carType: { type: "string", required: true },
    carBrand: { type: "string", required: true },
    carModel: { type: "string", required: true },
    carOnRoadPrice: { type: "number", required: true },
    carDownPayment: { type: "number", required: true },
    registrationCity: { type: "string", required: true },
    manufacturingYear: {
      type: "number",
      required: true,
      min: 2000,
      max: new Date().getFullYear() + 1,
    },
  },
  EDUCATION_LOAN: {
    requestAmount: { type: "number", required: true },
    eduTenure: { type: "number", required: true, min: 12, max: 120 },
    courseName: { type: "string", required: true },
    courseType: { type: "string", required: true },
    collegeName: { type: "string", required: true },
    collegeLocation: { type: "string", required: true },
    courseDuration: { type: "number", required: true },
    totalFees: { type: "number", required: true },
    admissionStatus: { type: "string", required: true },
  },
  LAP: {
    requestAmount: { type: "number", required: true },
    lapTenure: { type: "number", required: true, min: 12, max: 180 },
    lapPropertyType: { type: "string", required: true },
    lapPropertyLocation: { type: "string", required: true },
    lapPropertyValue: { type: "number", required: true },
    lapOwnership: { type: "string", required: true },
    lapRentalIncome: { type: "number", required: false },
    lapExistingLoan: { type: "boolean", required: true },
    lapExistingLoanAmount: { type: "number", required: false },
    lapExistingEmi: { type: "number", required: false },
  },
};

export const validateLoanDetails = (loanType, loanDetails) => {
  const schema = LOAN_FIELD_SCHEMAS[loanType];
  if (!schema) {
    throw new Error(`Invalid loan type: ${loanType}`);
  }

  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = loanDetails[field];
    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${field} is required`);
    }
    if (
      value !== undefined &&
      rules.type === "number" &&
      typeof value !== "number"
    ) {
      errors.push(`${field} must be a number`);
    }
    if (
      value !== undefined &&
      rules.type === "string" &&
      typeof value !== "string"
    ) {
      errors.push(`${field} must be a string`);
    }
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${field} must be at most ${rules.max}`);
    }
  }

  // Check for unknown fields (optional)
  for (const key of Object.keys(loanDetails)) {
    if (!schema[key]) {
      errors.push(`Unknown field: ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
  return true;
};
