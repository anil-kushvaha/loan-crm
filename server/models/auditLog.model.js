import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    section: String,
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      default: "UPDATE",
    },
  },
  { timestamps: true },
);

auditLogSchema.index({ applicantId: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
