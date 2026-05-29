import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { generatePDFFromElement, buildFullProfileHTML } from "../../utils/pdfGenerator";
import debounce from "lodash/debounce";
import "./LoanApplications.css";

// Fallback to localhost if the environment variable is not defined
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LoanApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loanTypeFilter, setLoanTypeFilter] = useState("ALL");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/loans/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch");
      setApplications(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const debouncedRefresh = useCallback(
    debounce(() => {
      setRefreshing(true);
      fetchApplications();
    }, 1000),
    []
  );

  const updateStatus = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/loans/status/${appId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      fetchApplications();
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const exportLoanPDF = async (app) => {
    if (actionInProgress === app._id) return;
    setActionInProgress(app._id);
    setSelectedApp(app);
    setTimeout(async () => {
      const element = document.getElementById("application-modal-content");
      if (!element) {
        setActionInProgress(null);
        return;
      }
      try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
        pdf.save(`Loan_Application_${app._id}.pdf`);
      } catch (err) {
        console.error("PDF error:", err);
      } finally {
        setActionInProgress(null);
      }
    }, 100);
  };

  // ✅ ZIP download function – calls backend endpoint
  const downloadFullProfile = async (application) => {
    if (actionInProgress === application._id) return;
    setActionInProgress(application._id);
    try {
      const token = localStorage.getItem("token");
      const customerId = application.customerId;
      
      // Adjusted path wrapper to comply cleanly with /api base configuration mapping variations
      const profileUrl = API_BASE_URL.endsWith('/api') 
        ? `${API_BASE_URL.replace(/\/api$/, '')}/api/v1/applicant/download-full-profile/${customerId}`
        : `${API_BASE_URL}/v1/applicant/download-full-profile/${customerId}`;

      const response = await fetch(profileUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Download failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Full_Profile_${customerId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Error downloading full profile: " + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
    if (loanTypeFilter !== "ALL" && app.loanType !== loanTypeFilter) return false;
    return true;
  });

  const loanTypeLabels = {
    PERSONAL_LOAN: "Personal Loan",
    HOME_LOAN: "Home Loan",
    CAR_LOAN: "Car Loan",
    EDUCATION_LOAN: "Education Loan",
    LAP: "Loan Against Property",
  };

  const statusColors = {
    PENDING: "status-pending",
    APPROVED: "status-approved",
    REJECTED: "status-rejected",
    DISBURSED: "status-disbursed",
  };

  const formatLoanDetails = (loanType, details) => {
    if (!details) return <p>No details</p>;
    switch (loanType) {
      case "PERSONAL_LOAN":
        return (
          <div className="loan-details">
            <p><strong>Request Amount:</strong> ₹ {details.requestAmount?.toLocaleString()}</p>
            <p><strong>Tenure:</strong> {details.personalTenure} months</p>
            <p><strong>Loan Purpose:</strong> {details.loanPurpose}</p>
          </div>
        );
      case "HOME_LOAN":
        return (
          <div className="loan-details">
            <p><strong>Request Amount:</strong> ₹ {details.requestAmount?.toLocaleString()}</p>
            <p><strong>Property Type:</strong> {details.propertyType}</p>
            <p><strong>Property Location:</strong> {details.propertyLocation}</p>
            <p><strong>Property Value:</strong> ₹ {details.propertyValue?.toLocaleString()}</p>
            <p><strong>Property Stage:</strong> {details.propertyStage}</p>
            <p><strong>CIBIL Score:</strong> {details.cibil}</p>
          </div>
        );
      case "CAR_LOAN":
        return (
          <div className="loan-details">
            <p><strong>Request Amount:</strong> ₹ {details.requestAmount?.toLocaleString()}</p>
            <p><strong>Tenure:</strong> {details.carTenure} months</p>
            <p><strong>Car Type:</strong> {details.carType}</p>
            <p><strong>Brand:</strong> {details.carBrand}</p>
            <p><strong>Model:</strong> {details.carModel}</p>
            <p><strong>On‑road Price:</strong> ₹ {details.carOnRoadPrice?.toLocaleString()}</p>
            <p><strong>Down Payment:</strong> ₹ {details.carDownPayment?.toLocaleString()}</p>
            <p><strong>Registration City:</strong> {details.registrationCity}</p>
            <p><strong>Manufacturing Year:</strong> {details.manufacturingYear}</p>
          </div>
        );
      default:
        return <pre>{JSON.stringify(details, null, 2)}</pre>;
    }
  };

  return (
    <div className="loan-applications-container">
      <div className="page-header">
        <h1>Loan Applications</h1>
        <p className="subtitle">Review and manage all loan applications</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="DISBURSED">Disbursed</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Loan Type</label>
          <select value={loanTypeFilter} onChange={(e) => setLoanTypeFilter(e.target.value)}>
            <option value="ALL">All</option>
            {Object.entries(loanTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <button className="refresh-btn" onClick={debouncedRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {loading && <div className="loading-skeleton">Loading applications...</div>}
      {error && <div className="error-card">{error}</div>}
      {!loading && !error && filteredApps.length === 0 && (
        <div className="empty-state">No loan applications found.</div>
      )}

      {!loading && !error && filteredApps.length > 0 && (
        <div className="table-wrapper">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Customer ID</th>
                <th>Loan Type</th>
                <th>Request Amount</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app._id}>
                  <td data-label="Name">{app.applicantId?.personalDetails?.fullName || "—"}</td>
                  <td data-label="Email">{app.applicantId?.personalDetails?.email || "—"}</td>
                  <td data-label="Mobile">{app.applicantId?.personalDetails?.mobile || "—"}</td>
                  <td data-label="Customer ID">{app.customerId || "—"}</td>
                  <td data-label="Loan Type">{loanTypeLabels[app.loanType] || app.loanType}</td>
                  <td data-label="Amount">₹ {app.loanDetails?.requestAmount?.toLocaleString() || "—"}</td>
                  <td data-label="Applied">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  <td data-label="Status"><span className={`status-badge ${statusColors[app.status]}`}>{app.status}</span></td>
                  <td data-label="Actions" className="action-buttons">
                    <button className="btn-view" onClick={() => setSelectedApp(app)}>View</button>
                    <button className="btn-pdf" onClick={() => exportLoanPDF(app)} disabled={actionInProgress === app._id}>
                      {actionInProgress === app._id ? "..." : "Loan PDF"}
                    </button>
                    <button className="btn-full" onClick={() => downloadFullProfile(app)} disabled={actionInProgress === app._id}>
                      {actionInProgress === app._id ? "..." : "Full Profile"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedApp(null)}>×</button>
            <div id="application-modal-content">
              <div className="modal-header">
                <h2>Loan Application Details</h2>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>Applicant Information</h3>
                  <div className="detail-grid">
                    <div><strong>Name:</strong> {selectedApp.applicantId?.personalDetails?.fullName}</div>
                    <div><strong>Email:</strong> {selectedApp.applicantId?.personalDetails?.email}</div>
                    <div><strong>Mobile:</strong> {selectedApp.applicantId?.personalDetails?.mobile}</div>
                    <div><strong>PAN:</strong> {selectedApp.applicantId?.personalDetails?.panCard || "—"}</div>
                    <div><strong>Customer ID:</strong> {selectedApp.customerId}</div>
                  </div>
                </div>
                <div className="detail-section">
                  <h3>Loan Information</h3>
                  <div className="detail-grid">
                    <div><strong>Loan Type:</strong> {loanTypeLabels[selectedApp.loanType]}</div>
                    <div><strong>Applied On:</strong> {new Date(selectedApp.appliedAt).toLocaleString()}</div>
                    <div><strong>Status:</strong>
                      <select value={selectedApp.status} onChange={(e) => updateStatus(selectedApp._id, e.target.value)}>
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="DISBURSED">DISBURSED</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="detail-section">
                  <h3>Loan Specific Details</h3>
                  {formatLoanDetails(selectedApp.loanType, selectedApp.loanDetails)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApplications;