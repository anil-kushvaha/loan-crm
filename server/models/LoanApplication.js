import mongoose from "mongoose";

export const LOAN_TYPES = {
  PERSONAL_LOAN: "PERSONAL_LOAN",
  HOME_LOAN: "HOME_LOAN",
  CAR_LOAN: "CAR_LOAN",
  EDUCATION_LOAN: "EDUCATION_LOAN",
  LAP: "LAP",
};

const loanApplicationSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    loanType: {
      type: String,
      enum: Object.values(LOAN_TYPES),
      required: true,
    },
    loanDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "DISBURSED"],
      default: "PENDING",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    remarks: String,
  },
  { timestamps: true },
);

// ✅ Compound unique index: one customer + one loan type only once
loanApplicationSchema.index({ applicantId: 1, loanType: 1 }, { unique: true });

export default mongoose.model("LoanApplication", loanApplicationSchema);
