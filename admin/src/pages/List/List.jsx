import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./CustomerList.css";

const API = import.meta.env.VITE_API_BASE_URL;

const initialForm = {
  name: "",
  mobile: "",
  panNumber: "",
  password: "",
};

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);

  // ---------------- FETCH CUSTOMERS ----------------
  const fetchCustomers = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/customer/customers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to fetch customers."
        );
      }

      setCustomers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    const controller = new AbortController();

    fetchCustomers(controller.signal);

    return () => controller.abort();
  }, [fetchCustomers]);

  // ---------------- FORM CHANGE ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------- EDIT CUSTOMER ----------------
  const handleEdit = (customer) => {
    setEditingId(customer._id);

    setForm({
      name: customer?.name || "",
      mobile: customer?.mobile || "",
      panNumber: customer?.panNumber || "",
      password: "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ---------------- RESET FORM ----------------
  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  // ---------------- UPDATE CUSTOMER ----------------
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        throw new Error("Customer name is required.");
      }

      const payload = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        panNumber: form.panNumber.trim().toUpperCase(),
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/customer/customer/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to update customer."
        );
      }

      setSuccess("Customer updated successfully.");

      resetForm();

      await fetchCustomers();
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- DELETE CUSTOMER ----------------
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/customer/customer/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message || "Delete failed."
        );
      }

      setSuccess("Customer deleted successfully.");

      setCustomers((prev) =>
        prev.filter((customer) => customer._id !== id)
      );
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------- SEARCH FILTER ----------------
  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return customers.filter((customer) =>
      `${customer?.name || ""} 
       ${customer?.email || ""} 
       ${customer?.mobile || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [customers, search]);

  return (
    <div className="customer-container">
      <div className="customer-header-section">
        <h1>Customer Directory</h1>

        <div className="search-container">
          <input
            className="search-box"
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div
        className={`customer-grid ${
          editingId ? "split-layout" : ""
        }`}
      >
        {editingId && (
          <div className="edit-box">
            <h2>Update Customer</h2>

            <form onSubmit={handleUpdate}>
              <div className="form-field-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field-group">
                <label>Password (Optional)</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="table-card">
          {loading ? (
            <div className="loading-row">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-row">
              No customers found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>PAN</th>
                    <th>Applicant ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td>{customer.name}</td>
                      <td>{customer.email || "—"}</td>
                      <td>{customer.mobile || "—"}</td>

                      <td>
                        {customer.panNumber || "—"}
                      </td>

                      <td>
                        {customer?.applicantId
                          ?.customerId || "—"}
                      </td>

                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn-table-edit"
                            onClick={() =>
                              handleEdit(customer)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn-table-delete"
                            disabled={
                              deletingId ===
                              customer._id
                            }
                            onClick={() =>
                              handleDelete(
                                customer._id
                              )
                            }
                          >
                            {deletingId ===
                            customer._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
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

export default CustomerList;