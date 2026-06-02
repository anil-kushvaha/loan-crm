import React, { useState } from "react";
import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import "./Login.css";

const API = import.meta.env.VITE_API_BASE_URL;

const ResetPassword = () => {
  const [searchParams] =
    useSearchParams();

  const navigate = useNavigate();

  const token =
    searchParams.get("token");

  const email =
    searchParams.get("email");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API}/auth/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to reset password"
        );
      }

      setSuccess(
        "Password updated successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Reset Password</h2>

        {success && (
          <div className="success">
            {success}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="input-group">
            <label>
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />
          </div>

          <div className="input-group">
            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm password"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;