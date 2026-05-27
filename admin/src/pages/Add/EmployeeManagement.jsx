import React, { useState, useEffect } from "react";
import "./EmployeeManagement.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEmployees();
  }, []);

  // FETCH EMPLOYEES
  const fetchEmployees = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch employees");
      }

      setEmployees(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // INPUT CHANGE
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setFormError("");
  };

  // RESET FORM
  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      mobile: "",
    });

    setEditingId(null);
  };

  // CREATE / UPDATE EMPLOYEE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      return setFormError("Name and Email are required");
    }

    if (!editingId && !form.password.trim()) {
      return setFormError("Password is required");
    }

    setSubmitLoading(true);
    setFormError("");

    try {
      const url = editingId
        ? `${API_URL}/admin/employee/${editingId}`
        : `${API_URL}/admin/create-employee`;

      const method = editingId ? "PUT" : "POST";

      const payload = editingId
        ? {
            name: form.name,
            email: form.email,
            mobile: form.mobile,
          }
        : form;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      resetForm();
      fetchEmployees();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // DELETE EMPLOYEE
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/employee/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      fetchEmployees();
    } catch (err) {
      alert(err.message);
    }
  };

  // EDIT EMPLOYEE
  const handleEdit = (emp) => {
    setEditingId(emp._id);

    setForm({
      name: emp.name || "",
      email: emp.email || "",
      mobile: emp.mobile || "",
      password: "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // CANCEL EDIT
  const cancelEdit = () => {
    resetForm();
  };

  return (
    <div className="employee-container">
      <h1>Employee Dashboard</h1>

      <div className="crm-grid">
        {/* FORM */}
        <div className="form-card">
          <h2>
            {editingId
              ? "Update Employee Details"
              : "Register New Employee"}
          </h2>

          {formError && (
            <div className="error-message">{formError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@company.com"
                required
              />
            </div>

            {!editingId && (
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="9016447620"
              />
            </div>

            <div className="btn-container">
              <button
                type="submit"
                disabled={submitLoading}
              >
                {submitLoading
                  ? "Please Wait..."
                  : editingId
                  ? "Update Employee"
                  : "Create Employee"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* EMPLOYEE LIST */}
        <div className="list-card">
          <h2>All Active Employees</h2>

          {loading && (
            <div className="loading">
              Loading employee database...
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            employees.length === 0 && (
              <div className="no-data">
                No employees found in the system.
              </div>
            )}

          {!loading &&
            !error &&
            employees.length > 0 && (
              <div className="table-responsive">
                <table className="employee-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp._id}>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.mobile || "—"}</td>
                        <td>
                          <span className="role-badge">
                            {emp.role || "Employee"}
                          </span>
                        </td>
                        <td>
                          {new Date(
                            emp.createdAt
                          ).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(emp)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn-delete"
                            onClick={() =>
                              handleDelete(emp._id)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;