import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SetPassword.css"; // same CSS as Login ya alag

const API = import.meta.env.VITE_API_BASE_URL;

const SetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    const emailParam = params.get("email");

    if (!tokenParam || !emailParam) {
      setError("Invalid or missing reset link. Please request a new one.");
    } else {
      setToken(tokenParam);
      setEmail(decodeURIComponent(emailParam));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { newPassword, confirmPassword } = form;

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to set password");
      }

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error && !token) {
    return (
      <div className="set-password-container">
        <div className="set-password-card">
          <h2>Invalid Link</h2>
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-container">
      <div className="set-password-card">
        <h2>Set Your Password</h2>
        <p>Please create a new password for your account.</p>

        {error && <div className="error">{error}</div>}
        {success && (
          <div className="success">
            Password set successfully! Redirecting to login...
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={form.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Setting password..." : "Set Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
