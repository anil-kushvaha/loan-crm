import React, { useState, useRef, useCallback } from "react";
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
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // ========== Pincode API (India Post) ==========
  const fetchPincodeDetails = useCallback(async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPincodeLoading(true);
    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`,
        { signal: controller.signal }
      );
      const data = await response.json();
      if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length) {
        const postOffice = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          city: postOffice.District || prev.city,
          state: postOffice.State || prev.state,
          country: postOffice.Country || prev.country,
        }));
        setMessage({ type: "success", text: "Address details auto-filled from pincode." });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: "Invalid pincode or no data found." });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Pincode API error:", err);
        setMessage({ type: "error", text: "Failed to fetch pincode details." });
      }
    } finally {
      setPincodeLoading(false);
    }
  }, []);

  // Debounced pincode handler
  const handlePincodeBlur = (e) => {
    const pincode = e.target.value;
    if (/^\d{6}$/.test(pincode)) {
      fetchPincodeDetails(pincode);
    }
  };

  // ========== Live Location (Geolocation + Reverse Geocode) ==========
  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Geolocation is not supported by your browser." });
      return;
    }

    setLocationLoading(true);
    setMessage({ type: "", text: "" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocoding using OpenStreetMap Nominatim (free, no API key)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            setFormData((prev) => ({
              ...prev,
              addressLine1: addr.road || addr.house_number || prev.addressLine1,
              city: addr.city || addr.town || addr.village || prev.city,
              state: addr.state || prev.state,
              pincode: addr.postcode || prev.pincode,
              country: addr.country || prev.country,
            }));
            setMessage({ type: "success", text: "Location fetched successfully. Review and save." });
          } else {
            setMessage({ type: "error", text: "Could not resolve address from coordinates." });
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setMessage({ type: "error", text: "Failed to fetch address details." });
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out.";
            break;
          default:
            break;
        }
        setMessage({ type: "error", text: errorMsg });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ========== Handle Form Submit ==========
  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const applicantId = applicant?._id || localStorage.getItem("applicantId");
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
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Pincode field with auto-fetch */}
        <div className="form-group">
          <label>Pincode</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              onBlur={handlePincodeBlur}
              placeholder="6-digit pincode"
              style={{ flex: 1 }}
            />
            {pincodeLoading && <span>Fetching...</span>}
          </div>
          <small>Enter pincode to auto‑fill city, state & country</small>
        </div>

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
            <label>Country</label>
            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <button
              type="button"
              onClick={getLiveLocation}
              disabled={locationLoading}
              className="location-btn"
            >
              {locationLoading ? "Fetching location..." : "📍 Get Current Location"}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Address"}
        </button>
      </form>

      <style jsx>{`
        .location-btn {
          background: #4b5563;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 6px;
        }
        .location-btn:hover:not(:disabled) {
          background: #374151;
        }
        .location-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        small {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default AddressDetails;