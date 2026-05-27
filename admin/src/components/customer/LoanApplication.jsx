import React, { useState } from "react";

const LOAN_TYPES = {
  PERSONAL_LOAN: "PERSONAL_LOAN",
  HOME_LOAN: "HOME_LOAN",
  CAR_LOAN: "CAR_LOAN",
  EDUCATION_LOAN: "EDUCATION_LOAN",
  LAP: "LAP",
};

const LoanApplication = ({ applicant, onUpdate }) => {
  const [loanType, setLoanType] = useState("");
  const [loanDetails, setLoanDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  if (!applicant.profileCompleted) {
    return (
      <div className="form-card">
        <h2>Apply for Loan</h2>
        <div className="warning">
          Complete your profile first (Personal, Address, Employment, Documents). Current: {applicant.profileCompletion}%
        </div>
      </div>
    );
  }

  const handleTypeChange = (e) => {
    setLoanType(e.target.value);
    setLoanDetails({});
  };

  const handleDetailChange = (field, value) => {
    setLoanDetails({ ...loanDetails, [field]: value });
  };

  const renderFields = () => {
    switch (loanType) {
      case LOAN_TYPES.PERSONAL_LOAN:
        return (
          <>
            <div className="form-group"><label>Request Amount (₹)</label><input type="number" onChange={e => handleDetailChange("requestAmount", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Tenure (months)</label><input type="number" onChange={e => handleDetailChange("personalTenure", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Loan Purpose</label><input type="text" onChange={e => handleDetailChange("loanPurpose", e.target.value)} required /></div>
          </>
        );
      case LOAN_TYPES.HOME_LOAN:
        return (
          <>
            <div className="form-group"><label>Request Amount (₹)</label><input type="number" onChange={e => handleDetailChange("requestAmount", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Property Type</label><input type="text" onChange={e => handleDetailChange("propertyType", e.target.value)} required /></div>
            <div className="form-group"><label>Property Location</label><input type="text" onChange={e => handleDetailChange("propertyLocation", e.target.value)} required /></div>
            <div className="form-group"><label>Property Value (₹)</label><input type="number" onChange={e => handleDetailChange("propertyValue", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Property Stage</label><input type="text" onChange={e => handleDetailChange("propertyStage", e.target.value)} required /></div>
            <div className="form-group"><label>CIBIL Score</label><input type="number" onChange={e => handleDetailChange("cibil", Number(e.target.value))} required /></div>
          </>
        );
      case LOAN_TYPES.CAR_LOAN:
        return (
          <>
            <div className="form-group"><label>Request Amount (₹)</label><input type="number" onChange={e => handleDetailChange("requestAmount", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Tenure (months)</label><input type="number" onChange={e => handleDetailChange("carTenure", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Car Type</label><input type="text" onChange={e => handleDetailChange("carType", e.target.value)} required /></div>
            <div className="form-group"><label>Brand</label><input type="text" onChange={e => handleDetailChange("carBrand", e.target.value)} required /></div>
            <div className="form-group"><label>Model</label><input type="text" onChange={e => handleDetailChange("carModel", e.target.value)} required /></div>
            <div className="form-group"><label>On‑road Price (₹)</label><input type="number" onChange={e => handleDetailChange("carOnRoadPrice", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Down Payment (₹)</label><input type="number" onChange={e => handleDetailChange("carDownPayment", Number(e.target.value))} required /></div>
            <div className="form-group"><label>Registration City</label><input type="text" onChange={e => handleDetailChange("registrationCity", e.target.value)} required /></div>
            <div className="form-group"><label>Manufacturing Year</label><input type="number" onChange={e => handleDetailChange("manufacturingYear", Number(e.target.value))} required /></div>
          </>
        );
      default: return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const applicantId = localStorage.getItem("applicantId");
    if (!applicantId) {
      setMessage({ type: "error", text: "Missing applicant ID. Please log out and log in again." });
      setLoading(false);
      return;
    }

    if (!loanType) {
      setMessage({ type: "error", text: "Please select a loan type" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/loans/apply/${applicantId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ loanType, loanDetails }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Submission failed");
      }
      setMessage({ type: "success", text: "Loan application submitted successfully!" });
      setLoanType("");
      setLoanDetails({});
      onUpdate();
    } catch (err) {
      console.error("Loan application error:", err);
      setMessage({ type: "error", text: err.message || "Failed to submit application" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Apply for Loan</h2>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Loan Type</label>
          <select value={loanType} onChange={handleTypeChange} required>
            <option value="">Select Loan Type</option>
            <option value={LOAN_TYPES.PERSONAL_LOAN}>Personal Loan</option>
            <option value={LOAN_TYPES.HOME_LOAN}>Home Loan</option>
            <option value={LOAN_TYPES.CAR_LOAN}>Car Loan</option>
            <option value={LOAN_TYPES.EDUCATION_LOAN}>Education Loan</option>
            <option value={LOAN_TYPES.LAP}>Loan Against Property</option>
          </select>
        </div>
        {renderFields()}
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Apply for Loan"}
        </button>
      </form>
    </div>
  );
};

export default LoanApplication;