import React, { useState } from "react";
import { apiRequest } from "../../utils/api";

const PersonalDetails = ({ applicant, onUpdate }) => {
  const [formData, setFormData] = useState({
    fullName: applicant?.personalDetails?.fullName || "",
    gender: applicant?.personalDetails?.gender || "",
    dob: applicant?.personalDetails?.dob?.split("T")[0] || "",
    email: applicant?.personalDetails?.email || "",
    mobile: applicant?.personalDetails?.mobile || "",
    alternateNumber: applicant?.personalDetails?.alternateNumber || "",
    panCard: applicant?.personalDetails?.panCard || "",
    aadhaar: applicant?.personalDetails?.aadhaar || "",
    fatherName: applicant?.personalDetails?.fatherName || "",
    motherName: applicant?.personalDetails?.motherName || "",
    maritalStatus: applicant?.personalDetails?.maritalStatus || "",
    spouseName: applicant?.personalDetails?.spouseName || "",
    qualification: applicant?.personalDetails?.qualification || "",
    preferredLanguage: applicant?.personalDetails?.preferredLanguage || "",
    nationality: applicant?.personalDetails?.nationality || "Indian",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const applicantId = localStorage.getItem("applicantId");

      await apiRequest({
        endpoint: `/v1/applicant/personal/${applicantId}`,
        method: "PUT",
        body: formData,
      });

      setMessage({
        type: "success",
        text: "Personal details saved!",
      });

      if (onUpdate) onUpdate();

      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Personal Details</h2>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Mobile *</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Alternate Number</label>
            <input
              type="tel"
              name="alternateNumber"
              value={formData.alternateNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>PAN Card</label>
            <input
              name="panCard"
              value={formData.panCard}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Aadhaar</label>
            <input
              name="aadhaar"
              value={formData.aadhaar}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Father's Name</label>
            <input
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Mother's Name</label>
            <input
              name="motherName"
              value={formData.motherName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Marital Status</label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Spouse Name</label>
            <input
              name="spouseName"
              value={formData.spouseName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Qualification</label>
            <input
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Preferred Language</label>
            <input
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Nationality</label>
          <input
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Personal Details"}
        </button>
      </form>
    </div>
  );
};

export default PersonalDetails;