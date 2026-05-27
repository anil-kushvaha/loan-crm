import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    ourServices: {
      type: String,
      default: "LOANS",
    },

    serviceType: {
      type: String,
      trim: true,
    },

    referenceName: {
      type: String,
      trim: true,
    },

    referenceEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    agreeToUpdates: {
      type: Boolean,
      default: false,
    },

    // IMPORTANT
    converted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Enquiry", enquirySchema);
