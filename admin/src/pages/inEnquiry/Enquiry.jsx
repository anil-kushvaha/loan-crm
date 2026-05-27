import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import "./ConvertEnquiry.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const INITIAL_FORM_STATE = {
  password: "",
  fullName: "",
  panNumber: "",
  mobile: "",
};

const ConvertEnquiry = () => {
  const [enquiries, setEnquiries] =
    useState([]);

  const [
    selectedEnquiry,
    setSelectedEnquiry,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] = useState(
    INITIAL_FORM_STATE
  );

  const token =
    localStorage.getItem("token");

  // -------------------------
  // API REQUEST HELPER
  // -------------------------
  const apiRequest =
    useCallback(
      async (
        endpoint,
        method = "GET",
        body = null,
        signal = null
      ) => {
        if (!token) {
          throw new Error(
            "Authentication failed. Please login again."
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
              method,
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: body
                ? JSON.stringify(body)
                : null,
              signal,
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
              "Request failed"
          );
        }

        return data;
      },
      [token]
    );

  // -------------------------
  // FETCH ENQUIRIES
  // -------------------------
  const fetchEnquiries =
    useCallback(
      async (signal) => {
        try {
          setLoading(true);
          setError("");

          const data =
            await apiRequest(
              "/enquiry/all",
              "GET",
              null,
              signal
            );

          setEnquiries(
            Array.isArray(data.data)
              ? data.data
              : []
          );
        } catch (err) {
          if (
            err.name !==
            "AbortError"
          ) {
            setError(
              err.message
            );
          }
        } finally {
          setLoading(false);
        }
      },
      [apiRequest]
    );

  useEffect(() => {
    const controller =
      new AbortController();

    fetchEnquiries(
      controller.signal
    );

    return () =>
      controller.abort();
  }, [fetchEnquiries]);

  // -------------------------
  // SELECT ENQUIRY
  // -------------------------
  const handleSelectEnquiry =
    useCallback((enquiry) => {
      setSelectedEnquiry(
        enquiry
      );

      setForm({
        password: "",
        fullName:
          enquiry.fullName ||
          "",
        panNumber:
          enquiry.panNumber ||
          "",
        mobile:
          enquiry.mobile ||
          "",
      });

      setError("");
      setSuccess("");
    }, []);

  // -------------------------
  // INPUT CHANGE
  // -------------------------
  const handleChange =
    useCallback((e) => {
      const {
        name,
        value,
      } = e.target;

      let formattedValue =
        value;

      // PAN uppercase
      if (
        name ===
        "panNumber"
      ) {
        formattedValue =
          value
            .toUpperCase()
            .replace(/\s/g, "");
      }

      // Mobile only numbers
      if (
        name === "mobile"
      ) {
        formattedValue =
          value.replace(
            /\D/g,
            ""
          );
      }

      setForm((prev) => ({
        ...prev,
        [name]:
          formattedValue,
      }));
    }, []);

  // -------------------------
  // VALIDATION
  // -------------------------
  const validateForm =
    () => {
      if (
        !selectedEnquiry
      ) {
        return "Please select an enquiry first.";
      }

      if (
        !form.password.trim()
      ) {
        return "Temporary password is required.";
      }

      if (
        form.password
          .trim()
          .length < 6
      ) {
        return "Password must be at least 6 characters.";
      }

      if (
        !form.fullName.trim()
      ) {
        return "Full name is required.";
      }

      const panRegex =
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

      if (
        form.panNumber &&
        !panRegex.test(
          form.panNumber
        )
      ) {
        return "Invalid PAN format (ABCDE1234F)";
      }

      if (
        form.mobile &&
        !/^\d{10}$/.test(
          form.mobile
        )
      ) {
        return "Mobile must be exactly 10 digits.";
      }

      return null;
    };

  // -------------------------
  // SUBMIT CONVERSION
  // -------------------------
  const handleSubmit =
    async (e) => {
      e.preventDefault();

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setError(
          validationError
        );
        return;
      }

      try {
        setSubmitting(
          true
        );

        setError("");
        setSuccess("");

        const payload =
          {
            enquiryId:
              selectedEnquiry._id,
            password:
              form.password.trim(),
            fullName:
              form.fullName.trim(),
            panNumber:
              form.panNumber.toUpperCase(),
            mobile:
              form.mobile.trim(),
          };

        await apiRequest(
          "/customer/convert-enquiry",
          "POST",
          payload
        );

        setSuccess(
          "Enquiry converted successfully!"
        );

        // Remove converted enquiry
        setEnquiries(
          (prev) =>
            prev.filter(
              (
                item
              ) =>
                item._id !==
                selectedEnquiry._id
            )
        );

        resetForm();
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  // -------------------------
  // RESET FORM
  // -------------------------
  const resetForm =
    useCallback(() => {
      setSelectedEnquiry(
        null
      );

      setForm(
        INITIAL_FORM_STATE
      );

      setError("");
    }, []);

  return (
    <div className="convert-container">
      <h1>
        Enquiry Conversion
        Desk
      </h1>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {success && (
        <div className="success">
          {success}
        </div>
      )}

      <div
        className={`dashboard-workspace ${
          selectedEnquiry
            ? "split-active"
            : ""
        }`}
      >
        {/* LEFT PANEL */}
        <div className="enquiries-panel">
          <h2>
            Pending
            Applications (
            {
              enquiries.length
            }
            )
          </h2>

          {loading ? (
            <div className="loading">
              Loading
              enquiries...
            </div>
          ) : enquiries.length ===
            0 ? (
            <div className="no-data">
              No pending
              enquiries found.
            </div>
          ) : (
            <div className="enquiry-cards">
              {enquiries.map(
                (
                  enquiry
                ) => (
                  <div
                    key={
                      enquiry._id
                    }
                    className={`enquiry-card ${
                      selectedEnquiry?._id ===
                      enquiry._id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleSelectEnquiry(
                        enquiry
                      )
                    }
                  >
                    <h3>
                      {
                        enquiry.fullName
                      }
                    </h3>

                    <p>
                      <strong>
                        Email:
                      </strong>{" "}
                      {
                        enquiry.email
                      }
                    </p>

                    <p>
                      <strong>
                        Mobile:
                      </strong>{" "}
                      {enquiry.mobile ||
                        "—"}
                    </p>

                    {enquiry.panNumber && (
                      <p>
                        <strong>
                          PAN:
                        </strong>{" "}
                        <span className="badge-pan-ref">
                          {
                            enquiry.panNumber
                          }
                        </span>
                      </p>
                    )}

                    <div className="badge-service">
                      {
                        enquiry.ourServices
                      }{" "}
                      •{" "}
                      {
                        enquiry.serviceType
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        {selectedEnquiry && (
          <div className="conversion-panel">
            <h2>
              Process
              Account
              Conversion
            </h2>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="form-group">
                <label>
                  Temporary
                  Password *
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter temporary password"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={
                    form.fullName
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  PAN
                  Number
                </label>

                <input
                  type="text"
                  name="panNumber"
                  value={
                    form.panNumber
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={
                    10
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Mobile
                </label>

                <input
                  type="text"
                  name="mobile"
                  value={
                    form.mobile
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={
                    10
                  }
                />
              </div>

              <div className="action-buttons">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Converting..."
                    : "Generate Active Account"}
                </button>

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={
                    resetForm
                  }
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConvertEnquiry;