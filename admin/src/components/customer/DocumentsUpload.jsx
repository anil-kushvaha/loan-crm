import React, { useState, useEffect } from "react";
import { uploadFile, apiRequest } from "../../utils/api";

const DocumentsUpload = ({ applicant, onUpdate }) => {
  const [documents, setDocuments] = useState(applicant?.documents || []);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // sync parent data
  useEffect(() => {
    setDocuments(applicant?.documents || []);
  }, [applicant]);

  // file change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    setFile(selectedFile);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl("");
    }
  };

  // upload handler (FIXED)
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file || !docName || !docType) {
      setMessage({
        type: "error",
        text: "Please fill all fields and select file",
      });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const applicantId =
        applicant?._id || localStorage.getItem("applicantId");

      if (!applicantId) {
        throw new Error("Applicant not found. Please login again.");
      }

      const formData = new FormData();
      formData.append("documentName", docName);
      formData.append("documentType", docType);
      formData.append("file", file);

      // ✅ ONLY THIS CALL (no extra broken fetch)
      await uploadFile(applicantId, formData);

      setMessage({
        type: "success",
        text: "Document uploaded successfully",
      });

      // reset
      setDocName("");
      setDocType("");
      setFile(null);
      setPreviewUrl("");

      // refresh parent (IMPORTANT)
      if (typeof onUpdate === "function") {
        await onUpdate();
      }

    } catch (err) {
      console.error("Upload error:", err);

      setMessage({
        type: "error",
        text: err.message || "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="cd-subtab-viewport-card">
      <div className="cd-doc-workspace">

        <h2>Document Vault</h2>

        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
          Upload your documents securely
        </p>

        {message.text && (
          <div className={`cd-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* FORM (UNCHANGED DESIGN) */}
        <form onSubmit={handleUpload} className="cd-form-layout">

          <div className="cd-form-group">
            <label>Document Name</label>
            <input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              required
            />
          </div>

          <div className="cd-form-group">
            <label>Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="identity">Identity</option>
              <option value="address">Address</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="cd-form-group">
            <label>File</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              required
            />
          </div>

          {previewUrl && (
            <div className="cd-live-preview-box">
              <img src={previewUrl} alt="preview" />
            </div>
          )}

          <button
            type="submit"
            className="cd-apply-now-btn"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </form>

        {/* LIST (UNCHANGED UI) */}
        <div className="cd-uploaded-section">
          {documents.length === 0 ? (
            <div>No documents found</div>
          ) : (
            <div className="cd-doc-two-column-grid">
              {documents.map((doc, idx) => (
                <div className="cd-doc-preview-card" key={idx}>
                  <div className="cd-doc-thumb-wrapper">
                    {doc.documentUrl?.match(/\.(jpg|jpeg|png)$/i) ? (
                      <img
                        src={doc.documentUrl}
                        className="cd-doc-thumbnail"
                        alt={doc.documentName}
                      />
                    ) : (
                      <div className="cd-doc-icon-placeholder">📄</div>
                    )}

                    <span
                      className={`cd-doc-badge ${
                        doc.verified ? "verified" : "pending"
                      }`}
                    >
                      {doc.verified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="cd-doc-meta">
                    <h4>{doc.documentName}</h4>
                    <span>{doc.documentType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DocumentsUpload;