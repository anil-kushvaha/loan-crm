import React, { useState, useEffect } from "react";
import { apiRequest } from "../../utils/api";

const MyLoansList = ({ applicantId }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await apiRequest(`/loans/my-applications/${applicantId}`);
        // Filter out disbursed loans (or show only non-disbursed)
        const activeLoans = res.data.filter(loan => loan.status !== "DISBURSED");
        setLoans(activeLoans);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (applicantId) fetchLoans();
  }, [applicantId]);

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
      PENDING: "status-pending",
      APPROVED: "status-approved",
      REJECTED: "status-rejected",
      DISBURSED: "status-disbursed",
    };
    return classes[status] || "status-pending";
  };

  if (loading) return <div className="loading">Loading your loan applications...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="loans-container">
      <h1>My Loan Applications</h1>
      {loans.length === 0 ? (
        <div className="empty-loans">
          <p>No active loan applications found.</p>
          <p><small>Note: Disbursed loans are not shown here.</small></p>
        </div>
      ) : (
        <div className="loans-table-wrapper">
          <table className="loans-table">
            <thead>
              <tr>
                <th>Loan Type</th>
                <th>Request Amount</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan._id}>
                  <td>{getLoanTypeLabel(loan.loanType)}</td>
                  <td>₹ {loan.loanDetails?.requestAmount?.toLocaleString() || "—"}</td>
                  <td>{new Date(loan.appliedAt).toLocaleDateString()}</td>
                  <td><span className={`status-badge ${getStatusClass(loan.status)}`}>{loan.status}</span></td>
                  <td><button className="view-details" onClick={() => alert(JSON.stringify(loan.loanDetails, null, 2))}>View Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyLoansList;