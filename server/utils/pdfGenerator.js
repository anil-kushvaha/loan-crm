// utils/buildFullProfileHTML.js

export const buildFullProfileHTML = (applicant = {}, loanApps = []) => {
  const personal = applicant?.personalDetails || {};
  const address = applicant?.addressDetails || {};
  const employment = applicant?.employmentDetails || {};
  const coApplicants = applicant?.coApplicants || [];
  const documents = applicant?.documents || [];

  const loanTypeLabels = {
    PERSONAL_LOAN: "Personal Loan",
    HOME_LOAN: "Home Loan",
    CAR_LOAN: "Car Loan",
    EDUCATION_LOAN: "Education Loan",
    LAP: "Loan Against Property",
  };

  // Secure HTML escape
  const escapeHTML = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    return escapeHTML(value);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString("en-IN");
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return `₹ ${Number(amount).toLocaleString("en-IN")}`;
  };

  const createRow = (label, value) => `
    <tr>
      <td class="label-cell">
        ${escapeHTML(label)}
      </td>
      <td class="value-cell">
        ${value}
      </td>
    </tr>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Applicant Full Profile</title>

<style>
  body {
    font-family: Arial, sans-serif;
    background: #ffffff;
    color: #333;
    padding: 20px;
    line-height: 1.6;
  }

  .container {
    max-width: 900px;
    margin: auto;
  }

  h1 {
    color: #1e293b;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }

  h2 {
    background: #f8fafc;
    padding: 10px;
    border-left: 5px solid #2563eb;
    margin-top: 30px;
    font-size: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }

  td {
    border: 1px solid #e2e8f0;
    padding: 10px;
  }

  .label-cell {
    width: 35%;
    font-weight: bold;
    background: #f8fafc;
  }

  .value-cell {
    background: #ffffff;
  }

  .card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin-top: 12px;
    background: #fff;
  }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }

  .approved {
    background: #dcfce7;
    color: #166534;
  }

  .pending {
    background: #fef3c7;
    color: #92400e;
  }

  .rejected {
    background: #fee2e2;
    color: #991b1b;
  }

  .disbursed {
    background: #dbeafe;
    color: #1e40af;
  }

  .document {
    margin-bottom: 8px;
    padding: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }

  .footer {
    margin-top: 30px;
    text-align: center;
    color: #64748b;
    font-size: 12px;
  }
</style>
</head>

<body>

<div class="container">

<h1>Applicant Full Profile</h1>

<p><strong>Customer ID:</strong>
${formatValue(applicant.customerId)}</p>

<p><strong>Profile Completion:</strong>
${applicant.profileCompletion || 0}%</p>

<p><strong>Profile Status:</strong>
${applicant.profileCompleted ? "Completed" : "Incomplete"}</p>

<h2>Personal Details</h2>

<table>
  ${createRow("Full Name", formatValue(personal.fullName))}
  ${createRow("Gender", formatValue(personal.gender))}
  ${createRow("Date of Birth", formatDate(personal.dob))}
  ${createRow("Email", formatValue(personal.email))}
  ${createRow("Mobile", formatValue(personal.mobile))}
  ${createRow("PAN Card", formatValue(personal.panCard))}
  ${createRow("Aadhaar", formatValue(personal.aadhaar))}
  ${createRow("Father Name", formatValue(personal.fatherName))}
  ${createRow("Mother Name", formatValue(personal.motherName))}
  ${createRow("Marital Status", formatValue(personal.maritalStatus))}
  ${createRow("Spouse Name", formatValue(personal.spouseName))}
  ${createRow("Qualification", formatValue(personal.qualification))}
  ${createRow("Preferred Language", formatValue(personal.preferredLanguage))}
</table>

<h2>Address Details</h2>

<table>
  ${createRow("Address Line 1", formatValue(address.addressLine1))}
  ${createRow("Address Line 2", formatValue(address.addressLine2))}
  ${createRow("Landmark", formatValue(address.landmark))}
  ${createRow("City", formatValue(address.city))}
  ${createRow("State", formatValue(address.state))}
  ${createRow("Pincode", formatValue(address.pincode))}
  ${createRow("Country", formatValue(address.country))}
</table>

<h2>Employment Details</h2>

<table>
  ${createRow("Employment Type", formatValue(employment.employmentType))}
  ${createRow("Company Name", formatValue(employment.companyName))}
  ${createRow("Salary", formatCurrency(employment.salary))}
  ${createRow("Annual Income", formatCurrency(employment.annualIncome))}
  ${createRow(
    "Work Experience",
    employment.workExperience ? `${employment.workExperience} years` : "—",
  )}
</table>

<h2>Co-Applicants</h2>

${
  coApplicants.length
    ? coApplicants
        .map(
          (co) => `
        <div class="card">
          <strong>
            ${formatValue(co.fullName)}
          </strong>
          <br/>
          Relation:
          ${formatValue(co.relation)}
          <br/>
          Mobile:
          ${formatValue(co.mobile)}
          <br/>
          Email:
          ${formatValue(co.email)}
        </div>
      `,
        )
        .join("")
    : "<p>No Co-Applicants</p>"
}

<h2>Documents</h2>

${
  documents.length
    ? documents
        .map(
          (doc) => `
        <div class="document">
          <strong>
            ${formatValue(doc.documentName)}
          </strong>
          <br/>
          Type:
          ${formatValue(doc.documentType)}
          <br/>
          Status:
          ${doc.verified ? "Verified" : "Pending"}
        </div>
      `,
        )
        .join("")
    : "<p>No documents uploaded.</p>"
}

<h2>Loan Applications</h2>

${
  loanApps.length
    ? loanApps
        .map((loan) => {
          const statusClass = loan.status?.toLowerCase() || "pending";

          return `
          <div class="card">
            <h3>
              ${loanTypeLabels[loan.loanType] || loan.loanType}
            </h3>

            <p>
              <strong>Status:</strong>
              <span class="badge ${statusClass}">
                ${formatValue(loan.status)}
              </span>
            </p>

            <p>
              <strong>Applied On:</strong>
              ${formatDateTime(loan.appliedAt)}
            </p>

            <p>
              <strong>Request Amount:</strong>
              ${formatCurrency(loan.loanDetails?.requestAmount)}
            </p>
          </div>
        `;
        })
        .join("")
    : "<p>No loan applications found.</p>"
}

<div class="footer">
Generated by Loan CRM System
</div>

</div>
</body>
</html>
`;
};
