import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import debounce from "lodash/debounce";
import "./LoanApplications.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ---------- Premium File Selector Modal (FIXED) ----------
const ZipContentSelector = ({ isOpen, onClose, zipBlob, customerId, onDownload }) => {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !zipBlob) return;
    const loadZip = async () => {
      try {
        const zip = await JSZip.loadAsync(zipBlob);
        const fileList = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir) {
            fileList.push({
              path: relativePath,
              name: relativePath.split("/").pop(),
            });
          }
        });
        setFiles(fileList);
        const initialSelected = {};
        fileList.forEach((file) => {
          initialSelected[file.path] = true;
        });
        setSelected(initialSelected);
        setError("");
      } catch (err) {
        console.error("Failed to unzip", err);
        setError("Could not read ZIP contents. The file may be corrupted.");
      } finally {
        setLoading(false);
      }
    };
    loadZip();
  }, [isOpen, zipBlob]);

  if (!isOpen) return null;

  const handleSelectAll = (checked) => {
    const newSelected = {};
    files.forEach((file) => {
      newSelected[file.path] = checked;
    });
    setSelected(newSelected);
  };

  const handleCheck = (path, checked) => {
    setSelected((prev) => ({ ...prev, [path]: checked }));
  };

  const handleDownloadSelected = async () => {
    const toDownload = files.filter((file) => selected[file.path]);
    if (toDownload.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    try {
      const zip = await JSZip.loadAsync(zipBlob);
      const newZip = new JSZip();

      for (const file of toDownload) {
        const fileData = await zip.file(file.path).async("blob");
        newZip.file(file.path, fileData);
      }

      const newZipBlob = await newZip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(newZipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Selected_Files_${customerId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error("Error creating new ZIP", err);
      alert("Failed to create ZIP with selected files.");
    }
  };

  const allSelected = files.length > 0 && files.every((f) => selected[f.path]);
  const someSelected = files.some((f) => selected[f.path]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container enhanced-detail-modal document-modal-premium" onClick={(e) => e.stopPropagation()}>
        
        {/* Premium Header Layout */}
        <div className="modal-header-premium">
          <div className="header-title-area">
            <span className="badge-loan-type">Attachments</span>
            <h2>Select Files to Download</h2>
            <p className="modal-id-subtitle">Customer ID: {customerId}</p>
          </div>
          <button className="modal-close-premium" onClick={onClose}>×</button>
        </div>

        <div className="modal-body-premium">
          {loading && <div className="loading-skeleton">Loading ZIP contents...</div>}
          {error && <div className="error-card">{error}</div>}
          
          {!loading && !error && (
            <>
              {/* Premium Select All Panel */}
              <div className="select-all-panel">
                <label className="premium-checkbox-label">
                  <input
                    type="checkbox"
                    className="premium-checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <div className="checkbox-text-group">
                    <span className="main-label">Select All Files</span>
                    <span className="sub-label">Check or uncheck all items at once</span>
                  </div>
                </label>
              </div>

              {/* Document List Stack */}
              <div className="documents-list-stack">
                {files.map((file) => (
                  <label key={file.path} className="premium-document-item">
                    <input
                      type="checkbox"
                      className="premium-checkbox"
                      checked={!!selected[file.path]}
                      onChange={(e) => handleCheck(file.path, e.target.checked)}
                    />
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-path">{file.path}</span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Premium Footer Design */}
        <div className="modal-footer-premium">
          <button className="btn-modal-dismiss margin-right-auto" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-premium-action" 
            onClick={handleDownloadSelected}
            disabled={loading || error || Object.values(selected).filter(Boolean).length === 0}
          >
            Download Selected ({Object.values(selected).filter(Boolean).length})
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Main Component ----------
const LoanApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loanTypeFilter, setLoanTypeFilter] = useState("ALL");
  const [actionInProgress, setActionInProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showZipSelector, setShowZipSelector] = useState(false);
  const [currentZipBlob, setCurrentZipBlob] = useState(null);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);

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

  const downloadFullProfileWithSelection = async (application) => {
    if (actionInProgress === application._id) return;
    setActionInProgress(application._id);

    try {
      const token = localStorage.getItem("token");
      const customerId = application.customerId;
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
      const zipBlob = await response.blob();
      setCurrentZipBlob(zipBlob);
      setCurrentCustomerId(customerId);
      setShowZipSelector(true);
    } catch (err) {
      console.error("Download error:", err);
      alert("Error fetching full profile: " + err.message);
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
                    <button
                      className="btn-full"
                      onClick={() => downloadFullProfileWithSelection(app)}
                      disabled={actionInProgress === app._id}
                    >
                      {actionInProgress === app._id ? "..." : "Full Profile"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details View Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-container enhanced-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-premium">
              <div className="header-title-area">
                <span className="badge-loan-type">{loanTypeLabels[selectedApp.loanType]}</span>
                <h2>Application Review</h2>
                <p className="modal-id-subtitle">Customer ID: {selectedApp.customerId}</p>
              </div>
              <button className="modal-close-premium" onClick={() => setSelectedApp(null)}>×</button>
            </div>

            <div id="application-modal-content" className="modal-body-premium">
              <div className="detail-card-section">
                <h3>Applicant Information</h3>
                <div className="premium-data-grid">
                  <div className="grid-item">
                    <label>Full Name</label>
                    <span>{selectedApp.applicantId?.personalDetails?.fullName || "—"}</span>
                  </div>
                  <div className="grid-item">
                    <label>Email Address</label>
                    <span className="text-lowercase">{selectedApp.applicantId?.personalDetails?.email || "—"}</span>
                  </div>
                  <div className="grid-item">
                    <label>Mobile Number</label>
                    <span>{selectedApp.applicantId?.personalDetails?.mobile || "—"}</span>
                  </div>
                  <div className="grid-item">
                    <label>PAN Card</label>
                    <span className="text-uppercase">{selectedApp.applicantId?.personalDetails?.panCard || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="detail-card-section">
                <h3>Loan Status & Timeline</h3>
                <div className="premium-data-grid status-grid-layout">
                  <div className="grid-item">
                    <label>Applied On</label>
                    <span>{new Date(selectedApp.appliedAt).toLocaleString()}</span>
                  </div>
                  <div className="grid-item">
                    <label>Application Status</label>
                    <div className="custom-select-wrapper">
                      <select 
                        className={`status-interactive-select ${selectedApp.status.toLowerCase()}`}
                        value={selectedApp.status} 
                        onChange={(e) => updateStatus(selectedApp._id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="DISBURSED">DISBURSED</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-card-section evaluation-specs">
                <h3>Financial Specifications</h3>
                <div className="specs-content-wrapper">
                  {formatLoanDetails(selectedApp.loanType, selectedApp.loanDetails)}
                </div>
              </div>
            </div>

            <div className="modal-footer-premium">
              <button className="btn-modal-dismiss" onClick={() => setSelectedApp(null)}>
                Dismiss View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Attachments Selector Modal */}
      <ZipContentSelector
        isOpen={showZipSelector}
        onClose={() => {
          setShowZipSelector(false);
          setCurrentZipBlob(null);
          setCurrentCustomerId(null);
        }}
        zipBlob={currentZipBlob}
        customerId={currentCustomerId}
      />
    </div>
  );
};

export default LoanApplications;