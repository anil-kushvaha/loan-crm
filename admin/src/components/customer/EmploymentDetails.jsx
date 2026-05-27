import React, { useState, useEffect } from "react";
import { apiRequest } from "../../utils/api";

const EmploymentDetails = ({ applicant, onUpdate }) => {
  const emp = applicant?.employmentDetails || {};

  const [formData, setFormData] = useState({
    employmentType: emp.employmentType || "",
    companyName: emp.companyName || "",
    salary: emp.salary || "",
    annualIncome: emp.annualIncome || "",
    workExperience: emp.workExperience || "",
    professionType: emp.professionType || "",
    businessName: emp.businessName || "",
    incomeSource: emp.incomeSource || "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const e = applicant?.employmentDetails || {};
    setFormData({
      employmentType: e.employmentType || "",
      companyName: e.companyName || "",
      salary: e.salary || "",
      annualIncome: e.annualIncome || "",
      workExperience: e.workExperience || "",
      professionType: e.professionType || "",
      businessName: e.businessName || "",
      incomeSource: e.incomeSource || "",
    });
  }, [applicant]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isSalaried = formData.employmentType === "salaried";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const applicantId =
        applicant?._id || localStorage.getItem("applicantId");

      if (!applicantId) {
        throw new Error("Applicant ID missing");
      }

      // CLEAN PAYLOAD
      const payload = {
        employmentType: formData.employmentType,
        annualIncome: formData.annualIncome,
      };

      if (isSalaried) {
        payload.companyName = formData.companyName;
        payload.salary = formData.salary;
        payload.workExperience = formData.workExperience;
        payload.professionType = formData.professionType;
      } else {
        payload.businessName = formData.businessName;
        payload.incomeSource = formData.incomeSource;
      }

      await apiRequest({
        endpoint: `/v1/applicant/employment/${applicantId}`,
        method: "PUT",
        body: payload,
      });

      setMessage({
        type: "success",
        text: "Employment details saved successfully",
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to save employment details",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Employment Details</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Employment Type</label>
          <select
            name="employmentType"
            value={formData.employmentType}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="salaried">Salaried</option>
            <option value="self-employed">Self Employed</option>
            <option value="business">Business</option>
            <option value="other">Other</option>
          </select>
        </div>

        {isSalaried && (
          <>
            <input
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Company Name"
            />

            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="Salary"
            />

            <input
              type="number"
              name="workExperience"
              value={formData.workExperience}
              onChange={handleChange}
              placeholder="Work Experience"
            />

            <input
              name="professionType"
              value={formData.professionType}
              onChange={handleChange}
              placeholder="Profession Type"
            />
          </>
        )}

        {!isSalaried && formData.employmentType && (
          <>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Business Name"
            />

            <input
              name="incomeSource"
              value={formData.incomeSource}
              onChange={handleChange}
              placeholder="Income Source"
            />
          </>
        )}

        <input
          type="number"
          name="annualIncome"
          value={formData.annualIncome}
          onChange={handleChange}
          placeholder="Annual Income"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Employment"}
        </button>
      </form>
    </div>
  );
};

export default EmploymentDetails;