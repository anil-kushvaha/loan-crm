import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import debounce from "lodash/debounce";
import "./LoanApplications.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to format values for display
const formatValue = (val) => (val ? val : "—");
const formatCurrency = (amt) =>
  amt ? `₹ ${Number(amt).toLocaleString("en-IN")}` : "—";
const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN") : "—";

const LoanApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loanTypeFilter, setLoanTypeFilter] = useState("ALL");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState({});

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

  // ----- Full Review Modal (show complete profile) -----
  const openFullReview = (app) => {
    setSelectedApp(app);
    setShowReviewModal(true);
  };

  // ----- Document Selection & Download -----
  const openDocSelector = (app) => {
    setSelectedApp(app);
    // Initialize selectedDocs: all documents unchecked by default
    const docs = app.applicantId?.documents || [];
    const initialSelected = {};
    docs.forEach((doc, idx) => {
      initialSelected[idx] = false;
    });
    setSelectedDocs(initialSelected);
    setShowDocModal(true);
  };

  const handleDocCheckbox = (idx, checked) => {
    setSelectedDocs((prev) => ({ ...prev, [idx]: checked }));
  };

  const downloadSelectedDocuments = async () => {
    const docs = selectedApp?.applicantId?.documents || [];
    const toDownload = docs.filter((_, idx) => selectedDocs[idx]);
    if (toDownload.length === 0) {
      alert("Please select at least one document.");
      return;
    }

    setActionInProgress("doc_zip");
    try {
      const zip = new JSZip();
      for (const doc of toDownload) {
        if (!doc.documentUrl) continue;
        const response = await fetch(doc.documentUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${doc.documentName}`);
        const blob = await response.blob();
        // Create safe filename
        const ext = doc.documentUrl.split(".").pop().split("?")[0];
        const safeName = `${doc.documentName}_${doc.documentType}.${ext}`.replace(/[^a-z0-9._-]/gi, "_");
        zip.file(safeName, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `selected_documents_${selectedApp.customerId}.zip`);
    } catch (err) {
      console.error("Zip error:", err);
      alert("Failed to download selected documents: " + err.message);
    } finally {
      setActionInProgress(null);
      setShowDocModal(false);
    }
  };

  const downloadSingleDocument = async (doc, idx) => {
    if (!doc.documentUrl) return;
    try {
      const response = await fetch(doc.documentUrl);
      const blob = await response.blob();
      const ext = doc.documentUrl.split(".").pop().split("?")[0];
      const fileName = `${doc.documentName}_${doc.documentType}.${ext}`.replace(/[^a-z0-9._-]/gi, "_");
      saveAs(blob, fileName);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download document.");
    }
  };

  // Helper to render the full profile inside the review modal
  const renderFullProfile = (app) => {
    const personal = app.applicantId?.personalDetails || {};
    const address = app.applicantId?.addressDetails || {};
    const employment = app.applicantId?.employmentDetails || {};
    const coApplicants = app.applicantId?.coApplicants || [];
    const documents = app.applicantId?.documents || [];

    const loanTypeLabels = {
      PERSONAL_LOAN: "Personal Loan",
      HOME_LOAN: "Home Loan",
      CAR_LOAN: "Car Loan",
      EDUCATION_LOAN: "Education Loan",
      LAP: "Loan Against Property",
    };

    return (
      <div className="full-profile-content">
        <h3>Applicant Profile</h3>
        <p><strong>Customer ID:</strong> {formatValue(app.customerId)}</p>
        <p><strong>Profile Completion:</strong> {app.applicantId?.profileCompletion || 0}%</p>

        <h4>Personal Details</h4>
        <div className="detail-grid">
          <div><strong>Full Name:</strong> {formatValue(personal.fullName)}</div>
          <div><strong>Gender:</strong> {formatValue(personal.gender)}</div>
          <div><strong>DOB:</strong> {formatDate(personal.dob)}</div>
          <div><strong>Email:</strong> {formatValue(personal.email)}</div>
          <div><strong>Mobile:</strong> {formatValue(personal.mobile)}</div>
          <div><strong>PAN:</strong> {formatValue(personal.panCard)}</div>
          <div><strong>Aadhaar:</strong> {formatValue(personal.aadhaar)}</div>
          <div><strong>Father:</strong> {formatValue(personal.fatherName)}</div>
          <div><strong>Mother:</strong> {formatValue(personal.motherName)}</div>
          <div><strong>Marital Status:</strong> {formatValue(personal.maritalStatus)}</div>
          <div><strong>Spouse:</strong> {formatValue(personal.spouseName)}</div>
          <div><strong>Qualification:</strong> {formatValue(personal.qualification)}</div>
        </div>

        <h4>Address Details</h4>
        <div className="detail-grid">
          <div><strong>Address Line 1:</strong> {formatValue(address.addressLine1)}</div>
          <div><strong>City:</strong> {formatValue(address.city)}</div>
          <div><strong>State:</strong> {formatValue(address.state)}</div>
          <div><strong>Pincode:</strong> {formatValue(address.pincode)}</div>
        </div>

        <h4>Employment Details</h4>
        <div className="detail-grid">
          <div><strong>Type:</strong> {formatValue(employment.employmentType)}</div>
          <div><strong>Company:</strong> {formatValue(employment.companyName)}</div>
          <div><strong>Monthly Salary:</strong> {formatCurrency(employment.salary)}</div>
          <div><strong>Annual Income:</strong> {formatCurrency(employment.annualIncome)}</div>
          <div><strong>Experience:</strong> {employment.workExperience ? `${employment.workExperience} years` : "—"}</div>
        </div>

        <h4>Loan Application</h4>
        <div className="detail-grid">
          <div><strong>Loan Type:</strong> {loanTypeLabels[app.loanType] || app.loanType}</div>
          <div><strong>Request Amount:</strong> {formatCurrency(app.loanDetails?.requestAmount)}</div>
          <div><strong>Status:</strong> {app.status}</div>
          <div><strong>Applied On:</strong> {new Date(app.appliedAt).toLocaleString()}</div>
        </div>

        <h4>Documents</h4>
        {documents.length ? (
          documents.map((doc, i) => (
            <div key={i} className="document-item">
              <strong>{doc.documentName}</strong> ({doc.documentType}) – {doc.verified ? "Verified" : "Pending"}
            </div>
          ))
        ) : (
          <p>No documents uploaded.</p>
        )}
      </div>
    );
  };

  // Filtering & rendering of table rows (unchanged except buttons)
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
                    {/* NEW: Full Review button */}
                    <button className="btn-review" onClick={() => openFullReview(app)}>
                      Full Review
                    </button>
                    {/* NEW: Select Documents button */}
                    <button className="btn-doc-select" onClick={() => openDocSelector(app)}>
                      Select Documents
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Loan Details (existing) */}
      {selectedApp && !showReviewModal && !showDocModal && (
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

      {/* FULL REVIEW MODAL */}
      {showReviewModal && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-container large-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            <div className="modal-header">
              <h2>Full Applicant Review</h2>
            </div>
            <div className="modal-body review-body">
              {renderFullProfile(selectedApp)}
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT SELECTION MODAL */}
      {showDocModal && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDocModal(false)}>×</button>
            <div className="modal-header">
              <h2>Select Documents to Download</h2>
            </div>
            <div className="modal-body">
              {selectedApp.applicantId?.documents?.length ? (
                <div className="doc-list">
                  {selectedApp.applicantId.documents.map((doc, idx) => (
                    <div key={idx} className="doc-select-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={!!selectedDocs[idx]}
                          onChange={(e) => handleDocCheckbox(idx, e.target.checked)}
                        />
                        <strong>{doc.documentName}</strong> ({doc.documentType})
                      </label>
                      <button
                        className="btn-single-download"
                        onClick={() => downloadSingleDocument(doc, idx)}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No documents available.</p>
              )}
              <div className="doc-modal-actions">
                <button
                  className="btn-download-zip"
                  onClick={downloadSelectedDocuments}
                  disabled={actionInProgress === "doc_zip"}
                >
                  {actionInProgress === "doc_zip" ? "Creating ZIP..." : "Download Selected as ZIP"}
                </button>
                <button className="btn-cancel" onClick={() => setShowDocModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApplications;