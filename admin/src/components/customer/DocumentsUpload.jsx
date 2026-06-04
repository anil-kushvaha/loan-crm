import React, { useState, useEffect, useCallback, memo } from "react";
import { uploadFile, deleteDocument } from "../../utils/api";

const REQUIRED_DOCUMENTS = [
  { name: "PAN Card", type: "identity", required: true },
  { name: "Aadhaar Card", type: "identity", required: true },
  { name: "Passport Size Photo", type: "identity", required: true },
  { name: "Salary Slips (Last 3 months)", type: "income", required: true },
  { name: "Bank Statement (Last 6 months)", type: "income", required: true },
];

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Memoized card component to prevent unnecessary re-renders
const DocumentCard = memo(({ 
  docName, 
  uploaded, 
  fileUrl, 
  onUpload, 
  onDelete, 
  uploading,
  onReplace 
}) => {
  const renderPreview = () => {
    if (!fileUrl) return null;
    const isImage = /\.(jpg|jpeg|png)$/i.test(fileUrl) || fileUrl.includes('image');
    if (isImage) {
      return <img src={fileUrl} alt={docName} className="preview-img" />;
    }
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="preview-link">
        View PDF
      </a>
    );
  };

  return (
    <div className="doc-card">
      <div className="doc-info">
        <div className="doc-name">{docName}</div>
        <div className="doc-status">
          {uploaded ? (
            <span className="status-badge success">Uploaded</span>
          ) : (
            <span className="status-badge pending">Pending</span>
          )}
        </div>
      </div>
      {uploaded && fileUrl && <div className="doc-preview">{renderPreview()}</div>}
      <div className="doc-actions">
        <label className="upload-btn">
          {uploaded ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={(e) => (onReplace ? onReplace(e.target) : onUpload(e.target))}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
        {uploaded && (
          <button className="delete-btn" onClick={() => onDelete(docName)} disabled={uploading}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
});

const DocumentsUpload = ({ applicant, onUpdate }) => {
  const [documents, setDocuments] = useState(applicant?.documents || []);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [customDocName, setCustomDocName] = useState("");
  const [customFile, setCustomFile] = useState(null);
  const [customPreview, setCustomPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (applicant?.documents) setDocuments(applicant.documents);
  }, [applicant]);

  const isDocumentUploaded = useCallback((name) => {
    return documents.some(d => d.documentName.toLowerCase() === name.toLowerCase());
  }, [documents]);

  const getDocument = useCallback((name) => {
    return documents.find(d => d.documentName.toLowerCase() === name.toLowerCase());
  }, [documents]);

  const getDocumentUrl = useCallback((name) => {
    return getDocument(name)?.documentUrl;
  }, [getDocument]);

  const addOrReplaceDocumentLocally = useCallback((name, type, file, url, publicId, docId = null) => {
    const lowerName = name.toLowerCase();
    const exists = documents.some(d => d.documentName.toLowerCase() === lowerName);
    let newDocs;
    if (exists) {
      newDocs = documents.map(d =>
        d.documentName.toLowerCase() === lowerName
          ? { ...d, documentUrl: url, publicId, documentType: type, uploadedAt: new Date(), ...(docId && { _id: docId }) }
          : d
      );
    } else {
      newDocs = [
        ...documents,
        {
          _id: docId || `temp-${Date.now()}`,
          documentName: name,
          documentType: type,
          documentUrl: url,
          publicId,
          verified: false,
          uploadedAt: new Date(),
        },
      ];
    }
    setDocuments(newDocs);
  }, [documents]);

  const deleteDocumentLocally = useCallback((name) => {
    setDocuments(prev => prev.filter(d => d.documentName.toLowerCase() !== name.toLowerCase()));
  }, []);

  const uploadDocument = useCallback(async (name, type, file) => {
    if (!file) throw new Error("No file selected");
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) throw new Error("Only JPEG, PNG, or PDF files allowed");
    if (file.size > MAX_FILE_SIZE) throw new Error("File size must be less than 5MB");

    const formData = new FormData();
    formData.append("documentName", name);
    formData.append("documentType", type);
    formData.append("file", file);

    const applicantId = applicant?._id || localStorage.getItem("applicantId");
    if (!applicantId) throw new Error("Applicant not found");

    const tempUrl = URL.createObjectURL(file);
    addOrReplaceDocumentLocally(name, type, file, tempUrl, "temp");

    try {
      const result = await uploadFile(applicantId, formData);
      const updatedApplicant = result.data;
      const realDoc = updatedApplicant.documents.find(d => d.documentName.toLowerCase() === name.toLowerCase());
      if (realDoc) {
        addOrReplaceDocumentLocally(name, type, file, realDoc.documentUrl, realDoc.publicId, realDoc._id);
      } else if (typeof onUpdate === "function") {
        await onUpdate(); // fallback full refresh
      }
      URL.revokeObjectURL(tempUrl);
      return result;
    } catch (err) {
      deleteDocumentLocally(name);
      URL.revokeObjectURL(tempUrl);
      throw err;
    }
  }, [applicant, onUpdate, addOrReplaceDocumentLocally, deleteDocumentLocally]);

  const handleDeleteDocument = useCallback(async (docName) => {
    const doc = getDocument(docName);
    if (!doc) return;
    if (!window.confirm(`Are you sure you want to delete ${docName}?`)) return;

    setUploading(true);
    setMessage({ type: "", text: "" });
    deleteDocumentLocally(docName);

    try {
      const applicantId = applicant?._id || localStorage.getItem("applicantId");
      await deleteDocument(applicantId, doc._id);
      setMessage({ type: "success", text: `${docName} deleted successfully!` });
      if (typeof onUpdate === "function") await onUpdate();
    } catch (err) {
      setDocuments(prev => [...prev, doc]);
      setMessage({ type: "error", text: err.message || "Delete failed" });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  }, [applicant, getDocument, onUpdate, deleteDocumentLocally]);

  const handleRequiredUpload = useCallback(async (doc, fileInput) => {
    const file = fileInput.files[0];
    if (!file) return;
    setUploading(true);
    setMessage({ type: "", text: "" });
    try {
      await uploadDocument(doc.name, doc.type, file);
      setMessage({ type: "success", text: `${doc.name} uploaded successfully!` });
      fileInput.value = "";
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Upload failed" });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  }, [uploadDocument]);

  const handleCustomUpload = useCallback(async (e) => {
    e.preventDefault();
    if (!customDocName.trim() || !customFile) {
      setMessage({ type: "error", text: "Please enter document name and select a file" });
      return;
    }
    setUploading(true);
    setMessage({ type: "", text: "" });
    try {
      await uploadDocument(customDocName.trim(), "other", customFile);
      setMessage({ type: "success", text: "Custom document uploaded!" });
      setCustomDocName("");
      setCustomFile(null);
      setCustomPreview("");
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Upload failed" });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  }, [customDocName, customFile, uploadDocument]);

  const handleCustomFileChange = useCallback((e) => {
    const file = e.target.files[0];
    setCustomFile(file);
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setCustomPreview(url);
    } else {
      setCustomPreview("");
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setCustomFile(file);
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setCustomPreview(url);
      } else {
        setCustomPreview("");
      }
    }
  }, []);

  const customDocuments = documents.filter(doc =>
    doc.documentType === "other" &&
    !REQUIRED_DOCUMENTS.some(req => req.name.toLowerCase() === doc.documentName.toLowerCase())
  );

  return (
    <div className="documents-container">
      <h2>Required Documents</h2>
      <p className="doc-subtitle">
        Please upload the following documents. Supported formats: JPG, PNG, PDF (max 5MB each)
      </p>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="required-docs-grid">
        {REQUIRED_DOCUMENTS.map(doc => {
          const uploaded = isDocumentUploaded(doc.name);
          const url = getDocumentUrl(doc.name);
          return (
            <DocumentCard
              key={`${doc.name}-${url || 'pending'}`}
              docName={doc.name}
              uploaded={uploaded}
              fileUrl={url}
              onUpload={(input) => handleRequiredUpload(doc, input)}
              onDelete={handleDeleteDocument}
              uploading={uploading}
            />
          );
        })}
      </div>

      {customDocuments.length > 0 && (
        <div className="other-docs-section">
          <h3>Other Documents</h3>
          <div className="other-docs-grid">
            {customDocuments.map(doc => (
              <DocumentCard
                key={`${doc._id}-${doc.documentUrl}`}
                docName={doc.documentName}
                uploaded={true}
                fileUrl={doc.documentUrl}
                onDelete={handleDeleteDocument}
                onReplace={async (input) => {
                  const file = input.files[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    await uploadDocument(doc.documentName, "other", file);
                    setMessage({ type: "success", text: `${doc.documentName} replaced successfully!` });
                  } catch (err) {
                    setMessage({ type: "error", text: err.message });
                  } finally {
                    setUploading(false);
                    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                  }
                  input.value = "";
                }}
                uploading={uploading}
              />
            ))}
          </div>
        </div>
      )}

      <div className="custom-doc-section">
        <h3>Add Custom Document (Optional)</h3>
        <form onSubmit={handleCustomUpload} className="custom-form">
          <div className="form-group">
            <label>Document Name</label>
            <input
              type="text"
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
              placeholder="e.g., Rental Agreement, ITR, etc."
              required
            />
          </div>
          <div className="form-group">
            <label>File</label>
            <div
              className={`drop-area ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {customPreview ? (
                <div className="preview-area">
                  <img src={customPreview} alt="Preview" className="preview-img" />
                  <button
                    type="button"
                    className="remove-preview"
                    onClick={() => { setCustomFile(null); setCustomPreview(""); }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <p>Drag & drop a file here, or</p>
                  <label className="browse-btn">
                    Browse
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={handleCustomFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                  <p className="file-hint">JPG, PNG, PDF up to 5MB</p>
                </>
              )}
            </div>
          </div>
          <button type="submit" disabled={uploading || !customFile} className="submit-custom">
            {uploading ? "Uploading..." : "Upload Custom Document"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .documents-container { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h2, h3 { margin-bottom: 8px; color: #1e293b; }
        .doc-subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
        .required-docs-grid, .other-docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .doc-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; transition: box-shadow 0.2s; }
        .doc-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .doc-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .doc-name { font-weight: 600; color: #0f172a; }
        .status-badge { font-size: 12px; padding: 4px 8px; border-radius: 20px; }
        .status-badge.success { background: #dcfce7; color: #166534; }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        .doc-preview { margin: 12px 0; text-align: center; }
        .preview-img { max-width: 100%; max-height: 100px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .preview-link { display: inline-block; padding: 8px 12px; background: #e2e8f0; border-radius: 6px; font-size: 13px; text-decoration: none; color: #3b82f6; }
        .doc-actions { display: flex; gap: 10px; margin-top: 12px; }
        .upload-btn { background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; text-align: center; transition: background 0.2s; border: none; flex: 1; }
        .upload-btn:hover { background: #2563eb; }
        .delete-btn { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; flex: 1; }
        .delete-btn:hover:not(:disabled) { background: #dc2626; }
        .delete-btn:disabled, .upload-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .custom-doc-section { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 8px; }
        .other-docs-section { margin-top: 16px; }
        .custom-form { margin-top: 16px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #334155; }
        .form-group input[type="text"] { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
        .drop-area { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; background: #fafafa; transition: all 0.2s; cursor: pointer; }
        .drop-area.dragging { border-color: #3b82f6; background: #eff6ff; }
        .browse-btn { background: #e2e8f0; padding: 8px 16px; border-radius: 6px; cursor: pointer; display: inline-block; margin-top: 8px; font-size: 14px; }
        .browse-btn:hover { background: #cbd5e1; }
        .file-hint { font-size: 12px; color: #94a3b8; margin-top: 8px; }
        .preview-area { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .remove-preview { background: #ef4444; color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .submit-custom { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
        .submit-custom:hover:not(:disabled) { background: #059669; }
        .submit-custom:disabled { opacity: 0.6; cursor: not-allowed; }
        .message { padding: 12px; border-radius: 8px; margin-bottom: 20px; }
        .message.success { background: #dcfce7; color: #166534; border-left: 4px solid #22c55e; }
        .message.error { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; }
      `}</style>
    </div>
  );
};

export default DocumentsUpload;