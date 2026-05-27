import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (e) => {
    const { name, value } =
      e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // remove old error while typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const email =
        form.email.trim();

      const password =
        form.password.trim();

      if (!email || !password) {
        throw new Error(
          "Email and password are required"
        );
      }

      const response =
        await fetch(
          `${API}/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            "Login failed"
        );
      }

      const token =
        data?.data?.token;

      const user =
        data?.data?.user;

      if (!token || !user) {
        throw new Error(
          "Invalid server response"
        );
      }

      // Store auth
      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // Redirect by role
      switch (
        user.role?.toLowerCase()
      ) {
        case "admin":
        case "employee":
          navigate("/",
            { replace: true }
          );
          break;

        case "customer":
          navigate(
            "/customer/dashboard",
            {
              replace: true,
            }
          );
          break;

        default:
          navigate("/login", {
            replace: true,
          });
      }
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
        <h2>
          Login to Loan CRM
        </h2>

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
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={
                form.email
              }
              onChange={
                handleChange
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={
                form.password
              }
              onChange={
                handleChange
              }
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;