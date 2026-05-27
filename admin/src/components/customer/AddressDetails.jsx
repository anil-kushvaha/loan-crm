import React, { useState } from "react";
import { apiRequest } from "../../utils/api";

const AddressDetails = ({ applicant, onUpdate }) => {
  const [formData, setFormData] = useState({
    addressLine1: applicant?.addressDetails?.addressLine1 || "",
    addressLine2: applicant?.addressDetails?.addressLine2 || "",
    landmark: applicant?.addressDetails?.landmark || "",
    city: applicant?.addressDetails?.city || "",
    state: applicant?.addressDetails?.state || "",
    pincode: applicant?.addressDetails?.pincode || "",
    country: applicant?.addressDetails?.country || "India",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // ======================
  // INPUT HANDLER
  // ======================
  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  // ======================
  // SUBMIT (FIXED)
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const applicantId =
        applicant?._id || localStorage.getItem("applicantId");

      if (!applicantId) {
        throw new Error("Applicant not found. Please login again.");
      }

      const res = await apiRequest({
        endpoint: `/v1/applicant/address/${applicantId}`,
        method: "PUT",
        body: formData,
      });

      setMessage({
        type: "success",
        text: res?.message || "Address saved successfully!",
      });

      if (typeof onUpdate === "function") {
        await onUpdate();
      }
    } catch (err) {
      console.error("Address update error:", err);

      setMessage({
        type: "error",
        text: err.message || "Failed to save address",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>Address Details</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Address Line 1</label>
          <input
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Address Line 2</label>
          <input
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Landmark</label>
          <input
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>State</label>
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Pincode</label>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Address"}
        </button>
      </form>
    </div>
  );
};

export default AddressDetails;