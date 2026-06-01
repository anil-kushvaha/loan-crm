import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "employee", "customer"],
      required: true,
    },
    mobile: { type: String, trim: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant" },
    // ✅ ADD THESE TWO FIELDS:
    passwordResetToken: { type: String, index: true },
    passwordResetExpires: { type: Number }, // storing as timestamp (milliseconds)
  },
  { timestamps: true },
);

// Pre-save hook to hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
