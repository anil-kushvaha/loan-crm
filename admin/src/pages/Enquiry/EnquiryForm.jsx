import React, { useState, useCallback } from "react";
import "./EnquiryForm.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const INITIAL_FORM_STATE = {
  fullName: "",
  panNumber: "",
  email: "",
  mobile: "",
  ourServices: "",
  serviceType: "",
  referenceName: "",
  referenceEmail: "",
  agreeToUpdates: false,
};

const SERVICES_OPTIONS = [
  "LOANS",
  "INSURANCE",
  "INVESTMENT",
  "TAX CONSULTING",
];

const SERVICE_TYPE_OPTIONS = {
  LOANS: [
    "Home Loan",
    "Car Loan",
    "Personal Loan",
    "Education Loan",
    "Business Loan",
  ],
  INSURANCE: [
    "Health",
    "Life",
    "Vehicle",
    "Travel",
  ],
  INVESTMENT: [
    "Mutual Funds",
    "Fixed Deposits",
    "Bonds",
  ],
  "TAX CONSULTING": [
    "ITR Filing",
    "Tax Planning",
    "GST",
  ],
};

const EnquiryForm = () => {
  const [formData, setFormData] = useState(
    INITIAL_FORM_STATE
  );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // ---------------------------
  // INPUT CHANGE HANDLER
  // ---------------------------
  const handleChange = useCallback((e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    let formattedValue =
      type === "checkbox"
        ? checked
        : value;

    // Auto uppercase PAN
    if (name === "panNumber") {
      formattedValue = value
        .toUpperCase()
        .replace(/\s/g, "");
    }

    // Mobile only numbers
    if (name === "mobile") {
      formattedValue = value.replace(
        /\D/g,
        ""
      );
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,

      // Reset service type when category changes
      ...(name === "ourServices" && {
        serviceType: "",
      }),
    }));

    // Clear message while typing
    if (message.text) {
      setMessage({
        type: "",
        text: "",
      });
    }
  }, [message.text]);

  // ---------------------------
  // FORM VALIDATION
  // ---------------------------
  const validateForm = () => {
    const {
      fullName,
      panNumber,
      email,
      mobile,
      ourServices,
      serviceType,
      referenceEmail,
      agreeToUpdates,
    } = formData;

    if (!fullName.trim()) {
      return "Full Name is required";
    }

    if (fullName.trim().length < 3) {
      return "Full Name must be at least 3 characters";
    }

    const panRegex =
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panNumber.trim()) {
      return "PAN Number is required";
    }

    if (
      !panRegex.test(
        panNumber.toUpperCase()
      )
    ) {
      return "Invalid PAN format (ABCDE1234F)";
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      return "Email is required";
    }

    if (
      !emailRegex.test(email)
    ) {
      return "Please enter a valid email";
    }

    if (!mobile.trim()) {
      return "Mobile number is required";
    }

    if (
      !/^\d{10}$/.test(mobile)
    ) {
      return "Mobile number must be exactly 10 digits";
    }

    if (!ourServices) {
      return "Please select a service category";
    }

    if (!serviceType) {
      return "Please select a service type";
    }

    // Optional reference email validation
    if (
      referenceEmail &&
      !emailRegex.test(
        referenceEmail
      )
    ) {
      return "Reference email is invalid";
    }

    if (!agreeToUpdates) {
      return "Please accept Terms & Conditions";
    }

    return null;
  };

  // ---------------------------
  // API REQUEST
  // ---------------------------
  const submitEnquiry =
    async (payload) => {
      const response = await fetch(
        `${API_BASE_URL}/enquiry/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to submit enquiry"
        );
      }

      return data;
    };

  // ---------------------------
  // SUBMIT HANDLER
  // ---------------------------
  const handleSubmit =
    async (e) => {
      e.preventDefault();

      const validationError =
        validateForm();

      if (validationError) {
        setMessage({
          type: "error",
          text: validationError,
        });
        return;
      }

      try {
        setLoading(true);

        setMessage({
          type: "",
          text: "",
        });

        const payload = {
          fullName:
            formData.fullName.trim(),
          panNumber:
            formData.panNumber.toUpperCase(),
          email:
            formData.email.trim(),
          mobile:
            formData.mobile.trim(),
          ourServices:
            formData.ourServices,
          serviceType:
            formData.serviceType,
          referenceName:
            formData.referenceName.trim(),
          referenceEmail:
            formData.referenceEmail.trim(),
          agreeToUpdates:
            formData.agreeToUpdates,
        };

        await submitEnquiry(
          payload
        );

        setMessage({
          type: "success",
          text:
            "Enquiry submitted successfully!",
        });

        // Reset form
        setFormData(
          INITIAL_FORM_STATE
        );
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error.message ||
            "Something went wrong",
        });
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="enquiry-wrapper">
      <div className="enquiry-card">
        <header className="enquiry-header">
          <h1>
            Have Any Query? Get In
            Touch.
          </h1>
          <p>
            Feel free to reach out
            with any questions or
            let’s collaborate.
          </p>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="enquiry-form"
          noValidate
        >
          <div className="form-grid">
            <div className="form-group">
              <label>
                Full Name{" "}
                <span className="required">
                  *
                </span>
              </label>

              <input
                type="text"
                name="fullName"
                value={
                  formData.fullName
                }
                onChange={
                  handleChange
                }
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>
                PAN Number{" "}
                <span className="required">
                  *
                </span>
              </label>

              <input
                type="text"
                name="panNumber"
                value={
                  formData.panNumber
                }
                onChange={
                  handleChange
                }
                placeholder="ABCDE1234F"
                maxLength={10}
                autoCapitalize="characters"
              />
            </div>

            <div className="form-group">
              <label>
                Email{" "}
                <span className="required">
                  *
                </span>
              </label>

              <input
                type="email"
                name="email"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>
                Mobile{" "}
                <span className="required">
                  *
                </span>
              </label>

              <input
                type="tel"
                name="mobile"
                value={
                  formData.mobile
                }
                onChange={
                  handleChange
                }
                placeholder="9876543210"
                maxLength={10}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label>
                Our Services{" "}
                <span className="required">
                  *
                </span>
              </label>

              <select
                name="ourServices"
                value={
                  formData.ourServices
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  -- Select Category --
                </option>

                {SERVICES_OPTIONS.map(
                  (service) => (
                    <option
                      key={
                        service
                      }
                      value={
                        service
                      }
                    >
                      {service}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Service Type{" "}
                <span className="required">
                  *
                </span>
              </label>

              <select
                name="serviceType"
                value={
                  formData.serviceType
                }
                onChange={
                  handleChange
                }
                disabled={
                  !formData.ourServices
                }
              >
                <option value="">
                  -- Select Type --
                </option>

                {formData.ourServices &&
                  SERVICE_TYPE_OPTIONS[
                    formData
                      .ourServices
                  ]?.map(
                    (type) => (
                      <option
                        key={
                          type
                        }
                        value={
                          type
                        }
                      >
                        {type}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Reference Name
              </label>

              <input
                type="text"
                name="referenceName"
                value={
                  formData.referenceName
                }
                onChange={
                  handleChange
                }
                placeholder="Reference person"
              />
            </div>

            <div className="form-group">
              <label>
                Reference Email
              </label>

              <input
                type="email"
                name="referenceEmail"
                value={
                  formData.referenceEmail
                }
                onChange={
                  handleChange
                }
                placeholder="ref@email.com"
              />
            </div>
          </div>

          <div className="checkbox-section">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="agreeToUpdates"
                checked={
                  formData.agreeToUpdates
                }
                onChange={
                  handleChange
                }
              />

              <span className="checkmark"></span>

              <span className="checkbox-text">
                I agree to receive
                updates and
                promotional
                materials from{" "}
                <strong>
                  Krishna
                  Financecept
                </strong>{" "}
                via WhatsApp and
                accept the{" "}
                <strong>
                  Terms &
                  Conditions
                </strong>
                .
              </span>
            </label>
          </div>

          {message.text && (
            <div
              className={`form-message ${message.type}`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? (
              <span className="spinner-layout">
                <span className="spinner"></span>
                Submitting...
              </span>
            ) : (
              "Submit Enquiry"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EnquiryForm;