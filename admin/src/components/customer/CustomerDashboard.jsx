import React, { useState, useEffect } from "react";
import { apiRequest } from "../../utils/api";
import PersonalDetails from "./PersonalDetails";
import AddressDetails from "./AddressDetails";
import EmploymentDetails from "./EmploymentDetails";
import DocumentsUpload from "./DocumentsUpload";
import LoanApplication from "./LoanApplication";
import "./customerDashboard.css";

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  // Sub-navigation state for profile subsections
  const [activeProfileSubTab, setActiveProfileSubTab] = useState("personal");
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loanApplications, setLoanApplications] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);

  const fetchApplicant = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const customerId = user.customerId;
      if (!customerId) throw new Error("No customerId found. Please logout and login again.");
      
     const res = await apiRequest({
  endpoint: `/v1/applicant/${customerId}`,
});
      setApplicant(res.data);
      localStorage.setItem("applicantId", res.data._id);
      await fetchLoanApplications(res.data._id);
    } catch (err) {
      console.error(err);
      setError("Unable to find your profile. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Use direct fetch – backend loan routes are under /api/loans (no /v1)
 const fetchLoanApplications = async (applicantId) => {
  setLoansLoading(true);

  try {
    const res = await apiRequest({
      endpoint: `/loans/my-applications/${applicantId}`,
    });

    setLoanApplications(res.data || []);
  } catch (err) {
    console.error("Error fetching loans:", err);
    setLoanApplications([]);
  } finally {
    setLoansLoading(false);
  }
};
  useEffect(() => {
    fetchApplicant();
  }, []);

  const handleUpdate = () => fetchApplicant();

  if (loading) return <div className="cd-loading-screen"><div className="cd-spinner"></div><p>Loading your portal...</p></div>;
  if (error) return <div className="cd-error-container"><h3>System Error</h3><p>{error}</p><button onClick={fetchApplicant} className="cd-retry-btn">Retry Connection</button></div>;
  if (!applicant) return <div className="cd-error-container"><p>No applicant data profile mapped to this account.</p></div>;

  const completion = applicant.profileCompletion || 0;

  const getLoanTypeLabel = (type) => {
    const labels = {
      PERSONAL_LOAN: "Personal Loan",
      HOME_LOAN: "Home Loan",
      CAR_LOAN: "Car Loan",
      EDUCATION_LOAN: "Education Loan",
      LAP: "Loan Against Property",
    };
    return labels[type] || type;
  };

  const getStatusClass = (status) => {
    const classes = {
      PENDING: "cd-status-pending",
      APPROVED: "cd-status-approved",
      REJECTED: "cd-status-rejected",
      DISBURSED: "cd-status-disbursed",
    };
    return classes[status] || "cd-status-pending";
  };

  return (
    <div className="cd-root">
      
      {/* 1. DESKTOP LEFT SIDEBAR NAVIGATION */}
      <aside className="cd-sidebar">
     
        <nav className="cd-sidebar-nav">
          <button type="button" className={`cd-nav-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
            <span className="cd-nav-icon">👤</span> <span>My Profile</span>
          </button>
          <button type="button" className={`cd-nav-item ${activeTab === "apply" ? "active" : ""}`} onClick={() => setActiveTab("apply")}>
            <span className="cd-nav-icon">💰</span> <span>Apply for Loan</span>
          </button>
          <button type="button" className={`cd-nav-item ${activeTab === "loans" ? "active" : ""}`} onClick={() => setActiveTab("loans")}>
            <span className="cd-nav-icon">📋</span> <span>My Loans</span>
          </button>
        </nav>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="cd-mobile-nav">
        <button type="button" className={`cd-mobile-nav-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          <span className="cd-nav-icon">👤</span>
          <span>Profile</span>
        </button>
        <button type="button" className={`cd-mobile-nav-item ${activeTab === "apply" ? "active" : ""}`} onClick={() => setActiveTab("apply")}>
          <span className="cd-nav-icon">💰</span>
          <span>Apply</span>
        </button>
        <button type="button" className={`cd-mobile-nav-item ${activeTab === "loans" ? "active" : ""}`} onClick={() => setActiveTab("loans")}>
          <span className="cd-nav-icon">📋</span>
          <span>My Loans</span>
        </button>
      </nav>

      {/* 3. MAIN WINDOW WORKSPACE */}
      <main className="cd-main">
        
        {/* TABS CONTROLLER: PROFILE VIEW */}
        {activeTab === "profile" && (
          <div className="cd-profile-container">
            <div className="cd-header">
              <div className="cd-header-meta">
                <h1>My Profile Workspace</h1>
                <p>Complete multi-tier compliance checks to activate immediate funding options</p>
              </div>
              <div className="cd-progress-section">
                <div className="cd-progress-text">
                  <span>Profile Completion</span>
                  <span className="cd-percentage">{completion}%</span>
                </div>
                <div className="cd-progress-bar">
                  <div className="cd-progress-fill" style={{ width: `${completion}%` }}></div>
                </div>
              </div>
            </div>

            {/* FIXED TABS TRACK CONTROLLER: SARE TABS EK SAATH SHOW HONGE */}
            <div className="cd-profile-subnav-grid">
              <button 
                type="button"
                className={`cd-subnav-btn ${activeProfileSubTab === "personal" ? "active" : ""}`} 
                onClick={() => setActiveProfileSubTab("personal")}
              >
                Personal Info
              </button>

              <button 
                type="button"
                className={`cd-subnav-btn ${activeProfileSubTab === "address" ? "active" : ""}`} 
                onClick={() => setActiveProfileSubTab("address")}
              >
                Address Info
              </button>

              <button 
                type="button"
                className={`cd-subnav-btn ${activeProfileSubTab === "employment" ? "active" : ""}`} 
                onClick={() => setActiveProfileSubTab("employment")}
              >
                Employment
              </button>

              <button 
                type="button"
                className={`cd-subnav-btn ${activeProfileSubTab === "documents" ? "active" : ""}`} 
                onClick={() => setActiveProfileSubTab("documents")}
              >
                Documents
              </button>
            </div>

            {/* CONTROLLER VIEWPORT INJECTOR */}
            <div className="cd-subtab-viewport-card">
              {activeProfileSubTab === "personal" && (
                <PersonalDetails applicant={applicant} onUpdate={handleUpdate} />
              )}
              {activeProfileSubTab === "address" && (
                <AddressDetails applicant={applicant} onUpdate={handleUpdate} />
              )}
              {activeProfileSubTab === "employment" && (
                <EmploymentDetails applicant={applicant} onUpdate={handleUpdate} />
              )}
              {activeProfileSubTab === "documents" && (
                <DocumentsUpload applicant={applicant} onUpdate={handleUpdate} />
              )}
            </div>
          </div>
        )}

        {/* TABS CONTROLLER: APPLY VIEW */}
        {activeTab === "apply" && (
          <div className="cd-profile-container">
            <div className="cd-header">
              <h1>Apply for Loan</h1>
              <p>Select tailored financial loan programs matched with your computed risk assessment parameters.</p>
            </div>
            <div className="cd-subtab-viewport-card">
              <LoanApplication applicant={applicant} onUpdate={handleUpdate} />
            </div>
          </div>
        )}

        {/* TABS CONTROLLER: MY LOANS TABLE VIEW */}
        {activeTab === "loans" && (
          <div className="cd-loans-container">
            <div className="cd-section-header">
              <div>
                <h1>Portfolio Management</h1>
                <p>Track real-time legal statuses, processing logs, and verification states</p>
              </div>
            </div>
            
            {loansLoading ? (
              <div className="cd-loading-inner"><div className="cd-spinner-sm"></div>Fetching processing records...</div>
            ) : loanApplications.length === 0 ? (
              <div className="cd-empty-loans">
                <div className="cd-empty-icon">📁</div>
                <h3>No Applications Found</h3>
                <p>You haven't initiated any financial products on our server lines yet.</p>
                <button className="cd-apply-now-btn" onClick={() => setActiveTab("apply")}>Initiate Application</button>
              </div>
            ) : (
              <div className="cd-loans-table-wrapper">
                <table className="cd-loans-table">
                  <thead>
                    <tr>
                      <th>Loan Program</th>
                      <th>Principal Value</th>
                      <th>Application Date</th>
                      <th>Status Stage</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanApplications.map((loan) => (
                      <tr key={loan._id}>
                        <td>
                          <div className="cd-td-loan-type">
                            <span className="cd-loan-avatar">💼</span>
                            <strong>{getLoanTypeLabel(loan.loanType)}</strong>
                          </div>
                        </td>
                        <td><span className="cd-currency-weight">₹ {loan.loanDetails?.requestAmount?.toLocaleString() || "—"}</span></td>
                        <td>{new Date(loan.appliedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td><span className={`cd-status-badge ${getStatusClass(loan.status)}`}>{loan.status}</span></td>
                        <td style={{ textAlign: 'right' }}><button className="cd-view-details" onClick={() => alert(JSON.stringify(loan.loanDetails, null, 2))}>Audit View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;