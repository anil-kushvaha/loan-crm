import React, { useState, useEffect } from "react";
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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [age, setAge] = useState(null);

  // Qualification options
  const qualificationOptions = [
    "10th",
    "12th",
    "Diploma",
    "Graduate",
    "Post Graduate",
    "PhD",
    "Other",
  ];

  // Language options (Indian languages + English)
  const languageOptions = [
    "Hindi",
    "English",
    "Bengali",
    "Telugu",
    "Marathi",
    "Tamil",
    "Urdu",
    "Gujarati",
    "Kannada",
    "Malayalam",
    "Odia",
    "Punjabi",
    "Assamese",
    "Maithili",
    "Sanskrit",
  ];

  // Nationality options
  const nationalityOptions = ["Indian", "Other"];

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [formData.dob]);

  // Validation logic
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "fullName":
        if (!value.trim()) error = "Full Name is required";
        else if (value.trim().length < 2) error = "Name must be at least 2 characters";
        break;
      case "email":
        if (!value) error = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "Email is invalid";
        break;
      case "mobile":
        if (!value) error = "Mobile number is required";
        else if (!/^\d{10}$/.test(value)) error = "Mobile number must be exactly 10 digits";
        break;
      case "alternateNumber":
        if (value && !/^\d{10}$/.test(value))
          error = "Alternate number must be exactly 10 digits";
        break;
      case "panCard":
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(value))
          error = "PAN must be in format ABCDE1234F";
        break;
      case "aadhaar":
        if (value && !/^\d{12}$/.test(value))
          error = "Aadhaar must be exactly 12 digits";
        break;
      case "maritalStatus":
        if (!value) error = "Marital Status is required";
        break;
      case "spouseName":
        if (formData.maritalStatus === "married" && !value.trim())
          error = "Spouse Name is required when married";
        break;
      case "qualification":
        if (!value) error = "Qualification is required";
        break;
      case "preferredLanguage":
        if (!value) error = "Preferred Language is required";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Validate on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setMessage({ type: "error", text: "Please fix the errors before saving." });
      return;
    }

    setLoading(true);
    try {
      const applicantId = localStorage.getItem("applicantId");
      // Remove age from payload (not stored in backend)
      const { ...payload } = formData;
      await apiRequest({
        endpoint: `/v1/applicant/personal/${applicantId}`,
        method: "PUT",
        body: payload,
      });
      setMessage({ type: "success", text: "Personal details saved!" });
      if (onUpdate) onUpdate();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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
        {/* Full Name */}
        <div className="form-group">
          <label>Full Name *</label>
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={errors.fullName ? "error-input" : ""}
          />
          {errors.fullName && <span className="error-text">{errors.fullName}</span>}
        </div>

        <div className="form-row">
          {/* Gender */}
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date of Birth + Age */}
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />
            {age !== null && (
              <small className="age-hint">Age: {age} years</small>
            )}
          </div>
        </div>

        <div className="form-row">
          {/* Email */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error-input" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          {/* Mobile */}
          <div className="form-group">
            <label>Mobile *</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className={errors.mobile ? "error-input" : ""}
            />
            {errors.mobile && <span className="error-text">{errors.mobile}</span>}
          </div>
        </div>

        <div className="form-row">
          {/* Alternate Number (optional) */}
          <div className="form-group">
            <label>Alternate Number (Optional)</label>
            <input
              type="tel"
              name="alternateNumber"
              value={formData.alternateNumber}
              onChange={handleChange}
              className={errors.alternateNumber ? "error-input" : ""}
            />
            {errors.alternateNumber && <span className="error-text">{errors.alternateNumber}</span>}
          </div>

          {/* PAN */}
          <div className="form-group">
            <label>PAN Card</label>
            <input
              name="panCard"
              value={formData.panCard}
              onChange={handleChange}
              className={errors.panCard ? "error-input" : ""}
              placeholder="ABCDE1234F"
            />
            {errors.panCard && <span className="error-text">{errors.panCard}</span>}
          </div>
        </div>

        <div className="form-row">
          {/* Aadhaar */}
          <div className="form-group">
            <label>Aadhaar</label>
            <input
              name="aadhaar"
              value={formData.aadhaar}
              onChange={handleChange}
              className={errors.aadhaar ? "error-input" : ""}
              placeholder="12 digits"
            />
            {errors.aadhaar && <span className="error-text">{errors.aadhaar}</span>}
          </div>

          {/* Qualification dropdown */}
          <div className="form-group">
            <label>Qualification *</label>
            <select
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              className={errors.qualification ? "error-input" : ""}
            >
              <option value="">Select</option>
              {qualificationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.qualification && <span className="error-text">{errors.qualification}</span>}
          </div>
        </div>

        <div className="form-row">
          {/* Father Name */}
          <div className="form-group">
            <label>Father's Name</label>
            <input name="fatherName" value={formData.fatherName} onChange={handleChange} />
          </div>

          {/* Mother Name */}
          <div className="form-group">
            <label>Mother's Name</label>
            <input name="motherName" value={formData.motherName} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          {/* Marital Status */}
          <div className="form-group">
            <label>Marital Status *</label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className={errors.maritalStatus ? "error-input" : ""}
            >
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
            {errors.maritalStatus && <span className="error-text">{errors.maritalStatus}</span>}
          </div>

          {/* Spouse Name – only if married */}
          {formData.maritalStatus === "married" && (
            <div className="form-group">
              <label>Spouse Name *</label>
              <input
                name="spouseName"
                value={formData.spouseName}
                onChange={handleChange}
                className={errors.spouseName ? "error-input" : ""}
              />
              {errors.spouseName && <span className="error-text">{errors.spouseName}</span>}
            </div>
          )}
        </div>

        <div className="form-row">
          {/* Preferred Language */}
          <div className="form-group">
            <label>Preferred Language *</label>
            <select
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              className={errors.preferredLanguage ? "error-input" : ""}
            >
              <option value="">Select</option>
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            {errors.preferredLanguage && <span className="error-text">{errors.preferredLanguage}</span>}
          </div>

          {/* Nationality */}
          <div className="form-group">
            <label>Nationality</label>
            <select
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
            >
              {nationalityOptions.map((nat) => (
                <option key={nat} value={nat}>{nat}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Personal Details"}
        </button>
      </form>

      <style jsx>{`
        .error-input {
          border-color: #dc2626 !important;
        }
        .error-text {
          color: #dc2626;
          font-size: 12px;
          display: block;
          margin-top: 4px;
        }
        .age-hint {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default PersonalDetails;