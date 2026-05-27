// utils/pdfGenerator.js

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generate PDF from HTML element ID
 */
export const generatePDF = async (elementId, fileName = "document.pdf") => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  return generatePDFFromElement(element, fileName);
};

/**
 * Production Ready PDF Generator
 * - Multi-page support
 * - Better image quality
 * - Memory cleanup
 * - Safe error handling
 */
export const generatePDFFromElement = async (
  element,
  fileName = "document.pdf",
) => {
  if (!element) {
    throw new Error("PDF generation failed: element not found");
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(
      imgData,
      "JPEG",
      margin,
      position,
      imgWidth,
      imgHeight,
      undefined,
      "FAST",
    );

    heightLeft -= pageHeight - margin * 2;

    // Additional pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;

      pdf.addPage();

      pdf.addImage(
        imgData,
        "JPEG",
        margin,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST",
      );

      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(fileName);

    // Cleanup memory
    canvas.width = 0;
    canvas.height = 0;

    return true;
  } catch (error) {
    console.error("PDF generation failed:", error);

    throw new Error(error?.message || "Unable to generate PDF");
  }
};

/**
 * Escape HTML (security)
 */
const escapeHTML = (value) => {
  if (value === null || value === undefined) return "—";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

/**
 * Format value safely
 */
const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return escapeHTML(value);
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  if (!amount) return "—";

  return `₹ ${Number(amount).toLocaleString("en-IN")}`;
};

/**
 * Format date safely
 */
const formatDate = (date) => {
  if (!date) return "—";

  try {
    return new Date(date).toLocaleDateString("en-IN");
  } catch {
    return "—";
  }
};

/**
 * Build full profile HTML
 */
export const buildFullProfileHTML = (applicant, loanApps = []) => {
  if (!applicant) return "<h1>No Applicant Data</h1>";

  const personal = applicant.personalDetails || {};
  const address = applicant.addressDetails || {};
  const employment = applicant.employmentDetails || {};
  const documents = applicant.documents || [];

  const loanTypeLabels = {
    PERSONAL_LOAN: "Personal Loan",
    HOME_LOAN: "Home Loan",
    CAR_LOAN: "Car Loan",
    EDUCATION_LOAN: "Education Loan",
    LAP: "Loan Against Property",
  };

  const row = (label, value) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;font-weight:600;width:35%">
        ${label}
      </td>
      <td style="padding:8px;border:1px solid #ddd">
        ${formatValue(value)}
      </td>
    </tr>
  `;

  return `
  <div style="font-family:Arial;padding:20px;background:#fff;color:#111">
    
    <h1 style="color:#1e293b">
      Loan CRM - Applicant Profile
    </h1>

    <h2>Personal Details</h2>

    <table style="width:100%;border-collapse:collapse">
      ${row("Full Name", personal.fullName)}
      ${row("Email", personal.email)}
      ${row("Mobile", personal.mobile)}
      ${row("PAN", personal.panCard)}
      ${row("Aadhaar", personal.aadhaar)}
      ${row("DOB", formatDate(personal.dob))}
      ${row("Gender", personal.gender)}
      ${row("Father Name", personal.fatherName)}
      ${row("Mother Name", personal.motherName)}
      ${row("Marital Status", personal.maritalStatus)}
      ${row("Nationality", personal.nationality)}
    </table>

    <h2 style="margin-top:24px">
      Address Details
    </h2>

    <table style="width:100%;border-collapse:collapse">
      ${row("Address Line 1", address.addressLine1)}
      ${row("Address Line 2", address.addressLine2)}
      ${row("Landmark", address.landmark)}
      ${row("City", address.city)}
      ${row("State", address.state)}
      ${row("Pincode", address.pincode)}
      ${row("Country", address.country)}
    </table>

    <h2 style="margin-top:24px">
      Employment Details
    </h2>

    <table style="width:100%;border-collapse:collapse">
      ${row("Employment Type", employment.employmentType)}
      ${row("Company Name", employment.companyName)}
      ${row("Salary", formatCurrency(employment.salary))}
      ${row("Annual Income", formatCurrency(employment.annualIncome))}
      ${row("Experience", employment.workExperience)}
    </table>

    <h2 style="margin-top:24px">
      Documents
    </h2>

    ${
      documents.length
        ? documents
            .map(
              (doc) => `
            <div style="margin-bottom:10px">
              • ${formatValue(doc.documentName)}
              (${formatValue(doc.documentType)})
              - ${doc.verified ? "Verified" : "Pending"}
            </div>
          `,
            )
            .join("")
        : "<p>No Documents Uploaded</p>"
    }

    <h2 style="margin-top:24px">
      Loan Applications
    </h2>

    ${
      loanApps.length
        ? loanApps
            .map(
              (loan) => `
            <div style="
              border:1px solid #ddd;
              border-radius:8px;
              padding:12px;
              margin-bottom:16px;
            ">
              <h3>
                ${loanTypeLabels[loan.loanType] || loan.loanType}
              </h3>

              <p>
                <strong>Status:</strong>
                ${formatValue(loan.status)}
              </p>

              <p>
                <strong>Applied:</strong>
                ${formatDate(loan.appliedAt)}
              </p>

              <p>
                <strong>Amount:</strong>
                ${formatCurrency(loan.loanDetails?.requestAmount)}
              </p>
            </div>
          `,
            )
            .join("")
        : "<p>No Loan Applications</p>"
    }

  </div>
  `;
};
